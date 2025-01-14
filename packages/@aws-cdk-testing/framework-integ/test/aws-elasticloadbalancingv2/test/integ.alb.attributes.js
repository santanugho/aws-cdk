#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("aws-cdk-lib/aws-ec2");
const cdk = require("aws-cdk-lib");
const integ = require("@aws-cdk/integ-tests-alpha");
const elbv2 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-elbv2-integ');
const vpc = new ec2.Vpc(stack, 'VPC', {
    maxAzs: 2,
});
new elbv2.ApplicationLoadBalancer(stack, 'LB', {
    vpc,
    internetFacing: true,
    http2Enabled: false,
    idleTimeout: cdk.Duration.seconds(1000),
    dropInvalidHeaderFields: true,
    desyncMitigationMode: elbv2.DesyncMitigationMode.DEFENSIVE,
});
new elbv2.ApplicationLoadBalancer(stack, 'DesyncMitigationModeMonitor', {
    vpc,
    internetFacing: true,
    desyncMitigationMode: elbv2.DesyncMitigationMode.MONITOR,
});
new elbv2.ApplicationLoadBalancer(stack, 'DesyncMitigationModeStrictest', {
    vpc,
    internetFacing: true,
    desyncMitigationMode: elbv2.DesyncMitigationMode.STRICTEST,
});
new integ.IntegTest(app, 'Elbv2Test', {
    testCases: [stack],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuYWxiLmF0dHJpYnV0ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5hbGIuYXR0cmlidXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwyQ0FBMkM7QUFDM0MsbUNBQW1DO0FBQ25DLG9EQUFvRDtBQUNwRCxnRUFBZ0U7QUFFaEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0FBRXhELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFO0lBQ3BDLE1BQU0sRUFBRSxDQUFDO0NBQ1YsQ0FBQyxDQUFDO0FBRUgsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRTtJQUM3QyxHQUFHO0lBQ0gsY0FBYyxFQUFFLElBQUk7SUFDcEIsWUFBWSxFQUFFLEtBQUs7SUFDbkIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztJQUN2Qyx1QkFBdUIsRUFBRSxJQUFJO0lBQzdCLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTO0NBQzNELENBQUMsQ0FBQztBQUVILElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSw2QkFBNkIsRUFBRTtJQUN0RSxHQUFHO0lBQ0gsY0FBYyxFQUFFLElBQUk7SUFDcEIsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLG9CQUFvQixDQUFDLE9BQU87Q0FDekQsQ0FBQyxDQUFDO0FBRUgsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLCtCQUErQixFQUFFO0lBQ3hFLEdBQUc7SUFDSCxjQUFjLEVBQUUsSUFBSTtJQUNwQixvQkFBb0IsRUFBRSxLQUFLLENBQUMsb0JBQW9CLENBQUMsU0FBUztDQUMzRCxDQUFDLENBQUM7QUFFSCxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRTtJQUNwQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUM7Q0FDbkIsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGludGVnIGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzLWFscGhhJztcbmltcG9ydCAqIGFzIGVsYnYyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lbGFzdGljbG9hZGJhbGFuY2luZ3YyJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjayhhcHAsICdhd3MtY2RrLWVsYnYyLWludGVnJyk7XG5cbmNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHN0YWNrLCAnVlBDJywge1xuICBtYXhBenM6IDIsXG59KTtcblxubmV3IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKHN0YWNrLCAnTEInLCB7XG4gIHZwYyxcbiAgaW50ZXJuZXRGYWNpbmc6IHRydWUsXG4gIGh0dHAyRW5hYmxlZDogZmFsc2UsXG4gIGlkbGVUaW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMDAwKSxcbiAgZHJvcEludmFsaWRIZWFkZXJGaWVsZHM6IHRydWUsXG4gIGRlc3luY01pdGlnYXRpb25Nb2RlOiBlbGJ2Mi5EZXN5bmNNaXRpZ2F0aW9uTW9kZS5ERUZFTlNJVkUsXG59KTtcblxubmV3IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKHN0YWNrLCAnRGVzeW5jTWl0aWdhdGlvbk1vZGVNb25pdG9yJywge1xuICB2cGMsXG4gIGludGVybmV0RmFjaW5nOiB0cnVlLFxuICBkZXN5bmNNaXRpZ2F0aW9uTW9kZTogZWxidjIuRGVzeW5jTWl0aWdhdGlvbk1vZGUuTU9OSVRPUixcbn0pO1xuXG5uZXcgZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXIoc3RhY2ssICdEZXN5bmNNaXRpZ2F0aW9uTW9kZVN0cmljdGVzdCcsIHtcbiAgdnBjLFxuICBpbnRlcm5ldEZhY2luZzogdHJ1ZSxcbiAgZGVzeW5jTWl0aWdhdGlvbk1vZGU6IGVsYnYyLkRlc3luY01pdGlnYXRpb25Nb2RlLlNUUklDVEVTVCxcbn0pO1xuXG5uZXcgaW50ZWcuSW50ZWdUZXN0KGFwcCwgJ0VsYnYyVGVzdCcsIHtcbiAgdGVzdENhc2VzOiBbc3RhY2tdLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19