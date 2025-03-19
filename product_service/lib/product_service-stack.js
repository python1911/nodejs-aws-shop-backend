const cdk = require('aws-cdk-lib');
const lambdaNodejs = require('aws-cdk-lib/aws-lambda-nodejs');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const sqs = require('aws-cdk-lib/aws-sqs');
const sns = require('aws-cdk-lib/aws-sns');
const snsSubscriptions = require('aws-cdk-lib/aws-sns-subscriptions');
const eventSources = require('aws-cdk-lib/aws-lambda-event-sources');
const path = require('path');

class ProductServiceStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    //  DynamoDB Tables
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'products',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    const stocksTable = new dynamodb.Table(this, 'StocksTable', {
      tableName: 'stocks',
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
    });

    //  SQS Queue
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
      receiveMessageWaitTime: cdk.Duration.seconds(10),
    });

    //  SNS Topic & Email Subscription
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic');
    createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('your-email@example.com')
    );

    //  Lambda Config
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
        SQS_URL: catalogItemsQueue.queueUrl,
        SNS_TOPIC_ARN: createProductTopic.topicArn,
      },
      bundling: {
        nodeModules: ["@aws-sdk/client-dynamodb", "@aws-sdk/client-sqs", "@aws-sdk/client-sns"],
      },
    };

    //  Lambda Functions
    const getProductsListLambda = new lambdaNodejs.NodejsFunction(this, 'GetProductsListLambda', {
      entry: path.join(__dirname, '../src/handlers/getProductsList.js'),
      ...lambdaConfig
    });

    const getProductsByIdLambda = new lambdaNodejs.NodejsFunction(this, 'GetProductsByIdLambda', {
      entry: path.join(__dirname, '../src/handlers/getProductsById.js'),
      ...lambdaConfig
    });

    const createProductLambda = new lambdaNodejs.NodejsFunction(this, 'CreateProductLambda', {
      entry: path.join(__dirname, '../src/handlers/createProduct.js'),
      ...lambdaConfig
    });

    const catalogBatchProcessLambda = new lambdaNodejs.NodejsFunction(this, 'CatalogBatchProcessLambda', {
      entry: path.join(__dirname, '../src/handlers/catalogBatchProcess.js'),
      ...lambdaConfig
    });

    //  Grant Permissions
    productsTable.grantReadWriteData(catalogBatchProcessLambda);
    stocksTable.grantReadWriteData(catalogBatchProcessLambda);
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);
    createProductTopic.grantPublish(catalogBatchProcessLambda);

    //  API Gateway
    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Product Service API',
    });

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));
    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));

    const productResource = productsResource.addResource('{productId}');
    productResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));

    //  Add SQS Trigger
    catalogBatchProcessLambda.addEventSource(new eventSources.SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    }));

    //  Output API URL
    new cdk.CfnOutput(this, 'ProductApiUrl', { value: api.url });
  }
}

module.exports = { ProductServiceStack };