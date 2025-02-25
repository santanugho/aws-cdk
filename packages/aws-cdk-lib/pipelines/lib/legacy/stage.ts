import * as codebuild from '../../../aws-codebuild';
import * as codepipeline from '../../../aws-codepipeline';
import * as cpactions from '../../../aws-codepipeline-actions';
import { CodeBuildAction } from '../../../aws-codepipeline-actions';
import * as sns from '../../../aws-sns';
import { Stage, Aspects } from '../../../core';
import * as cxapi from '../../../cx-api';
import { Construct, Node } from 'constructs';
import { DeployCdkStackAction } from './actions';
import { CdkPipeline } from './pipeline';
import { AssetType } from '../blueprint/asset-type';
import { ApplicationSecurityCheck } from '../private/application-security-check';
import { AssetManifestReader, DockerImageManifestEntry, FileManifestEntry } from '../private/asset-manifest';
import { pipelineSynth } from '../private/construct-internals';
import { topologicalSort } from '../private/toposort';

/**
 * Construction properties for a CdkStage
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export interface CdkStageProps {
  /**
   * Name of the stage that should be created
   */
  readonly stageName: string;

  /**
   * The underlying Pipeline Stage associated with thisCdkStage
   */
  readonly pipelineStage: codepipeline.IStage;

  /**
   * The CodePipeline Artifact with the Cloud Assembly
   */
  readonly cloudAssemblyArtifact: codepipeline.Artifact;

  /**
   * Features the Stage needs from its environment
   */
  readonly host: IStageHost;

  /**
   * Run a security check before every application prepare/deploy actions.
   *
   * Note: Stage level security check can be overriden per application as follows:
   *   `stage.addApplication(app, { confirmBroadeningPermissions: false })`
   *
   * @default false
   */
  readonly confirmBroadeningPermissions?: boolean;

  /**
   * Optional SNS topic to send notifications to when any security check registers
   * changes within a application.
   *
   * Note: The Stage Notification Topic can be overriden per application as follows:
   *   `stage.addApplication(app, { securityNotificationTopic: newTopic })`
   *
   * @default undefined no stage level notification topic
   */
  readonly securityNotificationTopic?: sns.ITopic;
}


/**
 * Stage in a CdkPipeline
 *
 * You don't need to instantiate this class directly. Use
 * `cdkPipeline.addStage()` instead.
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export class CdkStage extends Construct {
  private _nextSequentialRunOrder = 1; // Must start at 1 eh
  private _manualApprovalCounter = 1;
  private readonly pipelineStage: codepipeline.IStage;
  private readonly cloudAssemblyArtifact: codepipeline.Artifact;
  private readonly stacksToDeploy = new Array<DeployStackCommand>();
  private readonly stageName: string;
  private readonly host: IStageHost;
  private readonly confirmBroadeningPermissions: boolean;
  private readonly pipeline?: CdkPipeline;
  private readonly securityNotificationTopic?: sns.ITopic;
  private _applicationSecurityCheck?: ApplicationSecurityCheck;
  private _prepared = false;

  constructor(scope: Construct, id: string, props: CdkStageProps) {
    super(scope, id);

    if (scope instanceof CdkPipeline) {
      this.pipeline = scope;
    }

    this.stageName = props.stageName;
    this.pipelineStage = props.pipelineStage;
    this.cloudAssemblyArtifact = props.cloudAssemblyArtifact;
    this.host = props.host;
    this.confirmBroadeningPermissions = props.confirmBroadeningPermissions ?? false;
    this.securityNotificationTopic = props.securityNotificationTopic;

    Aspects.of(this).add({ visit: () => this.prepareStage() });
  }

  /**
   * Add all stacks in the application Stage to this stage
   *
   * The application construct should subclass `Stage` and can contain any
   * number of `Stacks` inside it that may have dependency relationships
   * on one another.
   *
   * All stacks in the application will be deployed in the appropriate order,
   * and all assets found in the application will be added to the asset
   * publishing stage.
   */
  public addApplication(appStage: Stage, options: AddStageOptions = {}) {
    const asm = pipelineSynth(appStage);
    const extraRunOrderSpace = options.extraRunOrderSpace ?? 0;

    if (options.confirmBroadeningPermissions ?? this.confirmBroadeningPermissions) {
      this.addSecurityCheck(appStage, options);
    }

    if (asm.stacks.length === 0) {
      // If we don't check here, a more puzzling "stage contains no actions"
      // error will be thrown come deployment time.
      throw new Error(`The given Stage construct ('${appStage.node.path}') should contain at least one Stack`);
    }

    const sortedTranches = topologicalSort(asm.stacks,
      stack => stack.id,
      stack => stack.dependencies.map(d => d.id));

    for (const stacks of sortedTranches) {
      const runOrder = this.nextSequentialRunOrder(extraRunOrderSpace + 2); // 2 actions for Prepare/Execute ChangeSet
      let executeRunOrder = runOrder + extraRunOrderSpace + 1;

      // If we need to insert a manual approval action, then what's the executeRunOrder
      // now is where we add a manual approval step, and we allocate 1 more runOrder
      // for the execute.
      if (options.manualApprovals) {
        this.addManualApprovalAction({ runOrder: runOrder + 1 });
        executeRunOrder = this.nextSequentialRunOrder();
      }

      // These don't have a dependency on each other, so can all be added in parallel
      for (const stack of stacks) {
        this.addStackArtifactDeployment(stack, { runOrder, executeRunOrder });
      }
    }
  }

  /**
   * Get a cached version of an ApplicationSecurityCheck, which consists of:
   *  - CodeBuild Project to check for security changes in a stage
   *  - Lambda Function that approves the manual approval if no security changes are detected
   *
   * The ApplicationSecurityCheck is cached from the pipeline **if** this stage is scoped
   * to a CDK Pipeline. If this stage **is not** scoped to a pipeline, create an ApplicationSecurityCheck
   * scoped to the stage itself.
   *
   * @internal
   */
  private getApplicationSecurityCheck(): ApplicationSecurityCheck {
    if (this._applicationSecurityCheck) {
      return this._applicationSecurityCheck;
    }

    this._applicationSecurityCheck = this.pipeline
      ? this.pipeline._getApplicationSecurityCheck()
      : new ApplicationSecurityCheck(this, 'StageApplicationSecurityCheck', {
        codePipeline: this.pipelineStage.pipeline as codepipeline.Pipeline,
      });
    return this._applicationSecurityCheck;
  }

  /**
   * Add a deployment action based on a stack artifact
   */
  public addStackArtifactDeployment(stackArtifact: cxapi.CloudFormationStackArtifact, options: AddStackOptions = {}) {
    // Get all assets manifests and add the assets in 'em to the asset publishing stage.
    this.publishAssetDependencies(stackArtifact);

    // Remember for later, see 'prepare()'
    // We know that deploying a stack is going to take up 2 runorder slots later on.
    const runOrder = options.runOrder ?? this.nextSequentialRunOrder(2);
    const executeRunOrder = options.executeRunOrder ?? runOrder + 1;
    this.stacksToDeploy.push({
      prepareRunOrder: runOrder,
      executeRunOrder,
      stackArtifact,
    });

    this.advanceRunOrderPast(runOrder);
    this.advanceRunOrderPast(executeRunOrder);
  }

  /**
   * Add a manual approval action
   *
   * If you need more flexibility than what this method offers,
   * use `addAction` with a `ManualApprovalAction`.
   */
  public addManualApprovalAction(options: AddManualApprovalOptions = {}) {
    let actionName = options.actionName;
    if (!actionName) {
      actionName = `ManualApproval${this._manualApprovalCounter > 1 ? this._manualApprovalCounter : ''}`;
      this._manualApprovalCounter += 1;
    }

    this.addActions(new cpactions.ManualApprovalAction({
      actionName,
      runOrder: options.runOrder ?? this.nextSequentialRunOrder(),
    }));
  }

  /**
   * Add one or more CodePipeline Actions
   *
   * You need to make sure it is created with the right runOrder. Call `nextSequentialRunOrder()`
   * for every action to get actions to execute in sequence.
   */
  public addActions(...actions: codepipeline.IAction[]) {
    for (const action of actions) {
      this.pipelineStage.addAction(action);
    }
  }

  /**
   * Return the runOrder number necessary to run the next Action in sequence with the rest
   *
   * FIXME: This is here because Actions are immutable and can't be reordered
   * after creation, nor is there a way to specify relative priorities, which
   * is a limitation that we should take away in the base library.
   */
  public nextSequentialRunOrder(count: number = 1): number {
    const ret = this._nextSequentialRunOrder;
    this._nextSequentialRunOrder += count;
    return ret;
  }

  /**
   * Whether this Stage contains an action to deploy the given stack, identified by its artifact ID
   */
  public deploysStack(artifactId: string) {
    return this.stacksToDeploy.map(s => s.stackArtifact.id).includes(artifactId);
  }

  /**
   * Actually add all the DeployStack actions to the stage.
   *
   * We do this late because before we can render the actual DeployActions,
   * we need to know whether or not we need to capture the stack outputs.
   *
   * FIXME: This is here because Actions are immutable and can't be reordered
   * after creation, nor is there a way to specify relative priorities, which
   * is a limitation that we should take away in the base library.
   */
  private prepareStage() {
    // FIXME: Make sure this only gets run once. There seems to be an issue in the reconciliation
    // loop that may trigger this more than once if it throws an error somewhere, and the exception
    // that gets thrown here will then override the actual failure.
    if (this._prepared) { return; }
    this._prepared = true;

    for (const { prepareRunOrder, stackArtifact, executeRunOrder } of this.stacksToDeploy) {
      const artifact = this.host.stackOutputArtifact(stackArtifact.id);

      this.pipelineStage.addAction(DeployCdkStackAction.fromStackArtifact(this, stackArtifact, {
        baseActionName: this.simplifyStackName(stackArtifact.stackName),
        cloudAssemblyInput: this.cloudAssemblyArtifact,
        output: artifact,
        outputFileName: artifact ? 'outputs.json' : undefined,
        prepareRunOrder,
        executeRunOrder,
      }));
    }
  }

  /**
   * Advance the runorder counter so that the next sequential number is higher than the given one
   */
  private advanceRunOrderPast(lastUsed: number) {
    this._nextSequentialRunOrder = Math.max(lastUsed + 1, this._nextSequentialRunOrder);
  }

  /**
   * Simplify the stack name by removing the `Stage-` prefix if it exists.
   */
  private simplifyStackName(s: string) {
    return stripPrefix(s, `${this.stageName}-`);
  }

  /**
   * Add a security check before the prepare/deploy actions of an CDK stage.
   * The security check consists of two actions:
   *  - CodeBuild Action to check for security changes in a stage
   *  - Manual Approval Action that is auto approved via a Lambda if no security changes detected
   */
  private addSecurityCheck(appStage: Stage, options?: BaseStageOptions) {
    const { cdkDiffProject } = this.getApplicationSecurityCheck();
    const notificationTopic: sns.ITopic | undefined = options?.securityNotificationTopic ?? this.securityNotificationTopic;
    notificationTopic?.grantPublish(cdkDiffProject);

    const appStageName = appStage.stageName;
    const approveActionName = `${appStageName}ManualApproval`;
    const diffAction = new CodeBuildAction({
      runOrder: this.nextSequentialRunOrder(),
      actionName: `${appStageName}SecurityCheck`,
      input: this.cloudAssemblyArtifact,
      project: cdkDiffProject,
      variablesNamespace: `${appStageName}SecurityCheck`,
      environmentVariables: {
        STAGE_PATH: {
          value: Node.of(appStage).path,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
        STAGE_NAME: {
          value: this.stageName,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
        ACTION_NAME: {
          value: approveActionName,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
        ...notificationTopic ? {
          NOTIFICATION_ARN: {
            value: notificationTopic.topicArn,
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          },
          NOTIFICATION_SUBJECT: {
            value: `Confirm permission broadening in ${appStageName}`,
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          },
        } : {},
      },
    });

    const approve = new cpactions.ManualApprovalAction({
      actionName: approveActionName,
      runOrder: this.nextSequentialRunOrder(),
      additionalInformation: `#{${appStageName}SecurityCheck.MESSAGE}`,
      externalEntityLink: `#{${appStageName}SecurityCheck.LINK}`,
    });

    this.addActions(diffAction, approve);
  }

  /**
   * Make sure all assets depended on by this stack are published in this pipeline
   *
   * Taking care to exclude the stack template itself -- it is being published
   * as an asset because the CLI needs to know the asset publishing role when
   * pushing the template to S3, but in the case of CodePipeline we always
   * reference the template from the artifact bucket.
   *
   * (NOTE: this is only true for top-level stacks, not nested stacks. Nested
   * Stack templates are always published as assets).
   */
  private publishAssetDependencies(stackArtifact: cxapi.CloudFormationStackArtifact) {
    const assetManifests = stackArtifact.dependencies.filter(isAssetManifest);

    for (const manifestArtifact of assetManifests) {
      const manifest = AssetManifestReader.fromFile(manifestArtifact.file);

      for (const entry of manifest.entries) {
        let assetType: AssetType;
        if (entry instanceof DockerImageManifestEntry) {
          assetType = AssetType.DOCKER_IMAGE;
        } else if (entry instanceof FileManifestEntry) {
          // Don't publish the template for this stack
          if (entry.source.packaging === 'file' && entry.source.path === stackArtifact.templateFile) {
            continue;
          }

          assetType = AssetType.FILE;
        } else {
          throw new Error(`Unrecognized asset type: ${entry.type}`);
        }

        if (!entry.destination.assumeRoleArn) {
          throw new Error('assumeRoleArn is missing on asset and required');
        }

        this.host.publishAsset({
          assetManifestPath: manifestArtifact.file,
          assetId: entry.id.assetId,
          assetSelector: entry.id.toString(),
          assetType,
          assetPublishingRoleArn: entry.destination.assumeRoleArn,
        });
      }
    }
  }
}

/**
 * Additional options for adding a stack deployment
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export interface AddStackOptions {
  /**
   * Base runorder
   *
   * @default - Next sequential runorder
   */
  readonly runOrder?: number;

  /**
   * Base runorder
   *
   * @default - runOrder + 1
   */
  readonly executeRunOrder?: number;
}

/**
 * A single output of a Stack
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export class StackOutput {
  /**
   * The artifact and file the output is stored in
   */
  public readonly artifactFile: codepipeline.ArtifactPath;

  /**
   * The name of the output in the JSON object in the file
   */
  public readonly outputName: string;

  /**
   * Build a StackOutput from a known artifact and an output name
   */
  constructor(artifactFile: codepipeline.ArtifactPath, outputName: string) {
    this.artifactFile = artifactFile;
    this.outputName = outputName;
  }
}

function stripPrefix(s: string, prefix: string) {
  return s.startsWith(prefix) ? s.slice(prefix.length) : s;
}

function isAssetManifest(s: cxapi.CloudArtifact): s is cxapi.AssetManifestArtifact {
  // instanceof is too risky, and we're at a too late stage to properly fix.
  // return s instanceof cxapi.AssetManifestArtifact;
  return s.constructor.name === 'AssetManifestArtifact';
}

/**
 * Features that the Stage needs from its environment
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export interface IStageHost {
  /**
   * Make sure all the assets from the given manifest are published
   */
  publishAsset(command: AssetPublishingCommand): void;

  /**
   * Return the Artifact the given stack has to emit its outputs into, if any
   */
  stackOutputArtifact(stackArtifactId: string): codepipeline.Artifact | undefined;
}

/**
 * Instructions to publish certain assets
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export interface AssetPublishingCommand {
  /**
   * Asset manifest path
   */
  readonly assetManifestPath: string;

  /**
   * Asset identifier
   */
  readonly assetId: string;

  /**
   * Asset selector to pass to `cdk-assets`.
   */
  readonly assetSelector: string;

  /**
   * Type of asset to publish
   */
  readonly assetType: AssetType;

  /**
   * ARN of the IAM Role used to publish this asset.
   */
  readonly assetPublishingRoleArn: string;
}

/**
 * Base options for a pipelines stage
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export interface BaseStageOptions {
  /**
   * Runs a `cdk diff --security-only --fail` to pause the pipeline if there
   * are any security changes.
   *
   * If the stage is configured with `confirmBroadeningPermissions` enabled, you can use this
   * property to override the stage configuration. For example, Pipeline Stage
   * "Prod" has confirmBroadeningPermissions enabled, with applications "A", "B", "C". All three
   * applications will run a security check, but if we want to disable the one for "C",
   * we run `stage.addApplication(C, { confirmBroadeningPermissions: false })` to override the pipeline
   * stage behavior.
   *
   * Adds 1 to the run order space.
   *
   * @default false
   */
  readonly confirmBroadeningPermissions?: boolean;
  /**
   * Optional SNS topic to send notifications to when the security check registers
   * changes within the application.
   *
   * @default undefined no notification topic for security check manual approval action
   */
  readonly securityNotificationTopic?: sns.ITopic;
}

/**
 * Options for adding an application stage to a pipeline
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export interface AddStageOptions extends BaseStageOptions {
  /**
   * Add manual approvals before executing change sets
   *
   * This gives humans the opportunity to confirm the change set looks alright
   * before deploying it.
   *
   * @default false
   */
  readonly manualApprovals?: boolean;
  /**
   * Add room for extra actions
   *
   * You can use this to make extra room in the runOrder sequence between the
   * changeset 'prepare' and 'execute' actions and insert your own actions there.
   *
   * @default 0
   */
  readonly extraRunOrderSpace?: number;
}

/**
 * Options for addManualApproval
 *
 * @deprecated This class is part of the old API. Use the API based on the `CodePipeline` class instead
 */
export interface AddManualApprovalOptions {
  /**
   * The name of the manual approval action
   *
   * @default 'ManualApproval' with a rolling counter
   */
  readonly actionName?: string;

  /**
   * The runOrder for this action
   *
   * @default - The next sequential runOrder
   */
  readonly runOrder?: number;
}

/**
 * Queued "deploy stack" command that is reified during prepare()
 */
interface DeployStackCommand {
  prepareRunOrder: number;
  executeRunOrder: number;
  stackArtifact: cxapi.CloudFormationStackArtifact;
}
