/// !cdk-integ pragma:disable-update-workflow
import { App, Stack } from 'aws-cdk-lib';
import * as integ from '@aws-cdk/integ-tests-alpha';
import { getClusterVersionConfig } from './integ-tests-kubernetes-version';
import * as eks from 'aws-cdk-lib/aws-eks';

class EksAllHandlersInVpcStack extends Stack {

  constructor(scope: App, id: string) {
    super(scope, id);

    new eks.Cluster(this, 'EksAllHandlersInVpcStack', {
      ...getClusterVersionConfig(this),
      placeClusterHandlerInVpc: true,
    });
  }
}

const app = new App();

const stack = new EksAllHandlersInVpcStack(app, 'aws-cdk-eks-handlers-in-vpc-test');
new integ.IntegTest(app, 'aws-cdk-eks-handlers-in-vpc', {
  testCases: [stack],
});

app.synth();
