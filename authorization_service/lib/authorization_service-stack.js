const { Stack } = require('aws-cdk-lib');
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs');
const lambda = require('aws-cdk-lib/aws-lambda');
const path = require('path');
require('dotenv').config(); // optional if you want environment-based credentials

class AuthorizationServiceStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const basicAuthorizer = new NodejsFunction(this, 'basicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.resolve(__dirname, '../src/basicAuthorizer.js'),
      handler: 'handler',
      environment: {
        GITHUB_USERNAME: process.env.GITHUB_USERNAME, // or your GitHub user
        TEST_PASSWORD: process.env.TEST_PASSWORD     // e.g. "TEST_PASSWORD"
      },
    });

    // optional: outputs if you want to easily copy the ARN from CloudFormation outputs
    this.basicAuthorizerArnOutput = new cdk.CfnOutput(this, 'AuthorizerArn', {
      value: basicAuthorizer.functionArn,
      exportName: 'AuthorizerFnArn',
    });
  }
}

module.exports = { AuthorizationServiceStack };
