"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("aws-cdk-lib/aws-ec2");
const cdk = require("aws-cdk-lib");
const integ_tests_alpha_1 = require("@aws-cdk/integ-tests-alpha");
const custom_resources_1 = require("aws-cdk-lib/custom-resources");
/*
 *
 * Stack verification steps:
 *
 * aws lambda get-function-configuration --function-name <deployed-function-name>: should include a VPC config
 *
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-customresources-vpc');
const vpc = new ec2.Vpc(stack, 'Vpc');
new custom_resources_1.AwsCustomResource(stack, 'DescribeVpcAttribute', {
    onUpdate: {
        service: 'EC2',
        action: 'describeVpcAttribute',
        parameters: {
            VpcId: vpc.vpcId,
            Attribute: 'enableDnsHostnames',
        },
        physicalResourceId: custom_resources_1.PhysicalResourceId.of(vpc.vpcId),
    },
    policy: custom_resources_1.AwsCustomResourcePolicy.fromSdkCalls({ resources: custom_resources_1.AwsCustomResourcePolicy.ANY_RESOURCE }),
    timeout: cdk.Duration.minutes(3),
    vpc: vpc,
    vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
});
new integ_tests_alpha_1.IntegTest(app, 'CustomResourceVpc', {
    testCases: [stack],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuYXdzLWN1c3RvbS1yZXNvdXJjZS12cGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5hd3MtY3VzdG9tLXJlc291cmNlLXZwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUEyQztBQUMzQyxtQ0FBbUM7QUFDbkMsa0VBQXVEO0FBQ3ZELG1FQUE4RztBQUU5Rzs7Ozs7O0dBTUc7QUFFSCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLDZCQUE2QixDQUFDLENBQUM7QUFDaEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN0QyxJQUFJLG9DQUFpQixDQUFDLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtJQUNuRCxRQUFRLEVBQUU7UUFDUixPQUFPLEVBQUUsS0FBSztRQUNkLE1BQU0sRUFBRSxzQkFBc0I7UUFDOUIsVUFBVSxFQUFFO1lBQ1YsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1lBQ2hCLFNBQVMsRUFBRSxvQkFBb0I7U0FDaEM7UUFDRCxrQkFBa0IsRUFBRSxxQ0FBa0IsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztLQUNyRDtJQUNELE1BQU0sRUFBRSwwQ0FBdUIsQ0FBQyxZQUFZLENBQUMsRUFBRSxTQUFTLEVBQUUsMENBQXVCLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDakcsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNoQyxHQUFHLEVBQUUsR0FBRztJQUNSLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFO0NBQy9ELENBQUMsQ0FBQztBQUVILElBQUksNkJBQVMsQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLEVBQUU7SUFDdEMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDO0NBQ25CLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBJbnRlZ1Rlc3QgfSBmcm9tICdAYXdzLWNkay9pbnRlZy10ZXN0cy1hbHBoYSc7XG5pbXBvcnQgeyBBd3NDdXN0b21SZXNvdXJjZSwgQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3ksIFBoeXNpY2FsUmVzb3VyY2VJZCB9IGZyb20gJ2F3cy1jZGstbGliL2N1c3RvbS1yZXNvdXJjZXMnO1xuXG4vKlxuICpcbiAqIFN0YWNrIHZlcmlmaWNhdGlvbiBzdGVwczpcbiAqXG4gKiBhd3MgbGFtYmRhIGdldC1mdW5jdGlvbi1jb25maWd1cmF0aW9uIC0tZnVuY3Rpb24tbmFtZSA8ZGVwbG95ZWQtZnVuY3Rpb24tbmFtZT46IHNob3VsZCBpbmNsdWRlIGEgVlBDIGNvbmZpZ1xuICpcbiAqL1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1jZGstY3VzdG9tcmVzb3VyY2VzLXZwYycpO1xuY29uc3QgdnBjID0gbmV3IGVjMi5WcGMoc3RhY2ssICdWcGMnKTtcbm5ldyBBd3NDdXN0b21SZXNvdXJjZShzdGFjaywgJ0Rlc2NyaWJlVnBjQXR0cmlidXRlJywge1xuICBvblVwZGF0ZToge1xuICAgIHNlcnZpY2U6ICdFQzInLFxuICAgIGFjdGlvbjogJ2Rlc2NyaWJlVnBjQXR0cmlidXRlJyxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBWcGNJZDogdnBjLnZwY0lkLFxuICAgICAgQXR0cmlidXRlOiAnZW5hYmxlRG5zSG9zdG5hbWVzJyxcbiAgICB9LFxuICAgIHBoeXNpY2FsUmVzb3VyY2VJZDogUGh5c2ljYWxSZXNvdXJjZUlkLm9mKHZwYy52cGNJZCksXG4gIH0sXG4gIHBvbGljeTogQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kuZnJvbVNka0NhbGxzKHsgcmVzb3VyY2VzOiBBd3NDdXN0b21SZXNvdXJjZVBvbGljeS5BTllfUkVTT1VSQ0UgfSksXG4gIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDMpLFxuICB2cGM6IHZwYyxcbiAgdnBjU3VibmV0czogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTIH0sXG59KTtcblxubmV3IEludGVnVGVzdChhcHAsICdDdXN0b21SZXNvdXJjZVZwYycsIHtcbiAgdGVzdENhc2VzOiBbc3RhY2tdLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19