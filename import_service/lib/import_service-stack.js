const cdk = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda-nodejs');
const s3 = require('aws-cdk-lib/aws-s3');
const sqs = require('aws-cdk-lib/aws-sqs');
const s3n = require('aws-cdk-lib/aws-s3-notifications');
const path = require('path');

class ImportServiceStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    //  Create S3 Bucket for Importing Files
    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    new cdk.CfnOutput(this, 'ImportBucketName', { value: importBucket.bucketName });

    //  Create SQS Queue for Processing Imported Data
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
      receiveMessageWaitTime: cdk.Duration.seconds(10),
    });

    new cdk.CfnOutput(this, 'CatalogItemsQueueUrl', { value: catalogItemsQueue.queueUrl });

    //  Lambda Function: Generates Signed URLs for Uploading Files to S3
    const importProductsFileLambda = new lambda.NodejsFunction(this, 'ImportProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/importProductsFile.js'),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
      bundling: {
        nodeModules: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
      },
    });

    importBucket.grantPut(importProductsFileLambda);

    //  Lambda Function: Processes Uploaded CSV Files and Sends Messages to SQS
    const importFileParserLambda = new lambda.NodejsFunction(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/importFileParser.js'),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
        SQS_URL: catalogItemsQueue.queueUrl,
      },
      bundling: {
        nodeModules: ["@aws-sdk/client-s3", "@aws-sdk/client-sqs", "csv-parser"],
      },
    });

    importBucket.grantRead(importFileParserLambda);
    catalogItemsQueue.grantSendMessages(importFileParserLambda);

    //  Configure S3 Event Notification to Trigger importFileParserLambda
    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: 'uploaded/' }
    );

    //  Output API Gateway URL
    new cdk.CfnOutput(this, 'ImportServiceApiUrl', {
      value: `https://${this.region}.amazonaws.com/prod/import`,
    });
  }
}

module.exports = { ImportServiceStack };
