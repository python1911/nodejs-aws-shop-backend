const { Stack, Duration } = require('aws-cdk-lib');
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs');
const {
  RestApi,
  TokenAuthorizer,
  LambdaIntegration
} = require('aws-cdk-lib/aws-apigateway');
const lambda = require('aws-cdk-lib/aws-lambda');
const s3 = require('aws-cdk-lib/aws-s3');
const s3n = require('aws-cdk-lib/aws-s3-notifications');
const sqs = require('aws-cdk-lib/aws-sqs');
const path = require('path');
require('dotenv').config();

class ImportServiceStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // 1) S3 bucket
    const importBucket = new s3.Bucket(this, 'ImportBucket');

    // 2) SQS queue
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue');

    // 3) importProductsFile Lambda
    const importProductsFileLambda = new NodejsFunction(this, 'ImportProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/handlers/importProductsFile.js'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
    });

    // 4) importFileParser Lambda
    const importFileParserLambda = new NodejsFunction(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/handlers/importFileParser.js'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: importBucket.bucketName,
        SQS_URL: catalogItemsQueue.queueUrl,
      },
    });

    // 5) Grant permissions
    importBucket.grantReadWrite(importProductsFileLambda);
    importBucket.grantRead(importFileParserLambda);
    catalogItemsQueue.grantSendMessages(importFileParserLambda);

    // 6) S3 triggers importFileParser on "uploaded/" prefix
    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: 'uploaded/' }
    );

    // 7) API Gateway
    const api = new RestApi(this, 'ImportApi', {
      restApiName: 'Import Service',
    });
    const importResource = api.root.addResource('import');

    // 8) Reference the deployed authorizer by ARN
    // e.g. "arn:aws:lambda:us-east-1:123456789012:function:AuthorizationServiceStack-basicAuthorizerF74DD00A"
    // stored in .env: AUTHORIZER_ARN=arn:aws:lambda:us-east-1:...:function:AuthorizationServiceStack-basicAuthorizerF74DD00A
    const authorizerFn = lambda.Function.fromFunctionArn(
      this,
      'ImportedBasicAuthorizer',
      process.env.AUTHORIZER_ARN
    );

    const authorizer = new TokenAuthorizer(this, 'ImportAuth', {
      handler: authorizerFn,
      resultsCacheTtl: Duration.seconds(0),
      identitySource: 'method.request.header.Authorization',
    });

    // 9) Use authorizer for GET /import
    importResource.addMethod('GET', new LambdaIntegration(importProductsFileLambda), {
      authorizer,
    });

    // 10) Additional explicit Lambda perms
    new lambda.CfnPermission(this, 'ApiGatewayPermission', {
      action: 'lambda:InvokeFunction',
      functionName: importProductsFileLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.arnForExecuteApi()}/*/*/import`,
    });

    new lambda.CfnPermission(this, 'ParserLambdaS3InvokePermission', {
      action: 'lambda:InvokeFunction',
      functionName: importFileParserLambda.functionName,
      principal: 's3.amazonaws.com',
      sourceArn: importBucket.bucketArn,
    });
  }
}

module.exports = { ImportServiceStack };
