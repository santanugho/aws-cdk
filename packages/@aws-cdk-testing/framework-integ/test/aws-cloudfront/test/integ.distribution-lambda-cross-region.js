"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// !cdk-integ *
const lambda = require("aws-cdk-lib/aws-lambda");
const cdk = require("aws-cdk-lib");
const test_origin_1 = require("./test-origin");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const app = new cdk.App();
const region = 'eu-west-1';
const stack = new cdk.Stack(app, 'integ-distribution-lambda-cross-region', { env: { region: region } });
const lambdaFunction = new cloudfront.experimental.EdgeFunction(stack, 'Lambda', {
    code: lambda.Code.fromInline('foo'),
    handler: 'index.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
});
const lambdaFunction2 = new cloudfront.experimental.EdgeFunction(stack, 'Lambda2', {
    code: lambda.Code.fromInline('foo'),
    handler: 'index.handler',
    runtime: lambda.Runtime.NODEJS_14_X,
    stackId: `edge-lambda-stack-${region}-2`,
});
lambdaFunction.addAlias('live');
lambdaFunction2.addAlias('live');
new cloudfront.Distribution(stack, 'Dist', {
    defaultBehavior: {
        origin: new test_origin_1.TestOrigin('www.example.com'),
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        edgeLambdas: [
            {
                functionVersion: lambdaFunction.currentVersion,
                eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            },
            {
                functionVersion: lambdaFunction2.currentVersion,
                eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
            },
        ],
    },
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZGlzdHJpYnV0aW9uLWxhbWJkYS1jcm9zcy1yZWdpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5kaXN0cmlidXRpb24tbGFtYmRhLWNyb3NzLXJlZ2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdCQUFnQjtBQUNoQixpREFBaUQ7QUFDakQsbUNBQW1DO0FBQ25DLCtDQUEyQztBQUMzQyx5REFBeUQ7QUFFekQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDO0FBQzNCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsd0NBQXdDLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBRXhHLE1BQU0sY0FBYyxHQUFHLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRTtJQUMvRSxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO0lBQ25DLE9BQU8sRUFBRSxlQUFlO0lBQ3hCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7Q0FDcEMsQ0FBQyxDQUFDO0FBRUgsTUFBTSxlQUFlLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO0lBQ2pGLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7SUFDbkMsT0FBTyxFQUFFLGVBQWU7SUFDeEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztJQUNuQyxPQUFPLEVBQUUscUJBQXFCLE1BQU0sSUFBSTtDQUN6QyxDQUFDLENBQUM7QUFFSCxjQUFjLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2hDLGVBQWUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFFakMsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDekMsZUFBZSxFQUFFO1FBQ2YsTUFBTSxFQUFFLElBQUksd0JBQVUsQ0FBQyxpQkFBaUIsQ0FBQztRQUN6QyxXQUFXLEVBQUUsVUFBVSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0I7UUFDcEQsV0FBVyxFQUFFO1lBQ1g7Z0JBQ0UsZUFBZSxFQUFFLGNBQWMsQ0FBQyxjQUFjO2dCQUM5QyxTQUFTLEVBQUUsVUFBVSxDQUFDLG1CQUFtQixDQUFDLGNBQWM7YUFDekQ7WUFDRDtnQkFDRSxlQUFlLEVBQUUsZUFBZSxDQUFDLGNBQWM7Z0JBQy9DLFNBQVMsRUFBRSxVQUFVLENBQUMsbUJBQW1CLENBQUMsZUFBZTthQUMxRDtTQUNGO0tBQ0Y7Q0FDRixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gIWNkay1pbnRlZyAqXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGVzdE9yaWdpbiB9IGZyb20gJy4vdGVzdC1vcmlnaW4nO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbmNvbnN0IHJlZ2lvbiA9ICdldS13ZXN0LTEnO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2ludGVnLWRpc3RyaWJ1dGlvbi1sYW1iZGEtY3Jvc3MtcmVnaW9uJywgeyBlbnY6IHsgcmVnaW9uOiByZWdpb24gfSB9KTtcblxuY29uc3QgbGFtYmRhRnVuY3Rpb24gPSBuZXcgY2xvdWRmcm9udC5leHBlcmltZW50YWwuRWRnZUZ1bmN0aW9uKHN0YWNrLCAnTGFtYmRhJywge1xuICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKCdmb28nKSxcbiAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbn0pO1xuXG5jb25zdCBsYW1iZGFGdW5jdGlvbjIgPSBuZXcgY2xvdWRmcm9udC5leHBlcmltZW50YWwuRWRnZUZ1bmN0aW9uKHN0YWNrLCAnTGFtYmRhMicsIHtcbiAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZSgnZm9vJyksXG4gIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gIHN0YWNrSWQ6IGBlZGdlLWxhbWJkYS1zdGFjay0ke3JlZ2lvbn0tMmAsXG59KTtcblxubGFtYmRhRnVuY3Rpb24uYWRkQWxpYXMoJ2xpdmUnKTtcbmxhbWJkYUZ1bmN0aW9uMi5hZGRBbGlhcygnbGl2ZScpO1xuXG5uZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24oc3RhY2ssICdEaXN0Jywge1xuICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICBvcmlnaW46IG5ldyBUZXN0T3JpZ2luKCd3d3cuZXhhbXBsZS5jb20nKSxcbiAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX0RJU0FCTEVELFxuICAgIGVkZ2VMYW1iZGFzOiBbXG4gICAgICB7XG4gICAgICAgIGZ1bmN0aW9uVmVyc2lvbjogbGFtYmRhRnVuY3Rpb24uY3VycmVudFZlcnNpb24sXG4gICAgICAgIGV2ZW50VHlwZTogY2xvdWRmcm9udC5MYW1iZGFFZGdlRXZlbnRUeXBlLk9SSUdJTl9SRVFVRVNULFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZnVuY3Rpb25WZXJzaW9uOiBsYW1iZGFGdW5jdGlvbjIuY3VycmVudFZlcnNpb24sXG4gICAgICAgIGV2ZW50VHlwZTogY2xvdWRmcm9udC5MYW1iZGFFZGdlRXZlbnRUeXBlLk9SSUdJTl9SRVNQT05TRSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==