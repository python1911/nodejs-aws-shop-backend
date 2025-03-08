const cdk = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const s3n = require('aws-cdk-lib/aws-s3-notifications');

class ImportServiceStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create S3 bucket with an auto-generated unique name
    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Output the generated bucket name for reference
    new cdk.CfnOutput(this, 'ImportBucketName', {
      value: importBucket.bucketName,
    });

    // Export bucket for use in Lambda functions via environment variables
    this.importBucket = importBucket;

    // Create Lambda function to generate signed URLs (importProductsFile)
    const importProductsFileLambda = new lambda.Function(this, 'ImportProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importProductsFile.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
    });

    // Grant permission to put objects into the bucket
    importBucket.grantPut(importProductsFileLambda);

    // Create API Gateway REST API and integrate with the Lambda function
    const api = new apigateway.RestApi(this, 'ImportApi', {
      restApiName: 'Import Service API',
    });

    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda), {
      requestParameters: {
        'method.request.querystring.name': true,
      },
    });

    // Output the API URL for easy reference
    new cdk.CfnOutput(this, 'ImportApiUrl', {
      value: api.url,
    });

    // Create Lambda function to parse CSV files (importFileParser)
    const importFileParserLambda = new lambda.Function(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importFileParser.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    // Grant permission to read objects from the bucket
    importBucket.grantRead(importFileParserLambda);

    // Configure S3 event notifications for objects created in the 'uploaded/' folder
    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: 'uploaded/' }
    );
  }
}

module.exports = { ImportServiceStack };
