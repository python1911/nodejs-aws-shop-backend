const cdk = require("aws-cdk-lib");
const lambdaNodejs = require("aws-cdk-lib/aws-lambda-nodejs");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const sqs = require("aws-cdk-lib/aws-sqs");
const sns = require("aws-cdk-lib/aws-sns");
const snsSubscriptions = require("aws-cdk-lib/aws-sns-subscriptions");
const eventSources = require("aws-cdk-lib/aws-lambda-event-sources");
const iam = require("aws-cdk-lib/aws-iam");

class ProductServiceStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    //  Define DynamoDB Tables
    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      tableName: "products",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
    });

    const stocksTable = new dynamodb.Table(this, "StocksTable", {
      tableName: "stocks",
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
    });

    //  Define SQS Queue
    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      visibilityTimeout: cdk.Duration.seconds(30),
      receiveMessageWaitTime: cdk.Duration.seconds(10),
    });

    //  Define SNS Topic
    const createProductTopic = new sns.Topic(this, "CreateProductTopic");

    //  Add First Email Subscription (Receives All Messages)
    createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription("4u3v2w1@gmail.com")
    );

    //  Add Second Email Subscription with a Filter Policy (Receives Only Electronics & Books)
    createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription("4u3v2w1@gmail.com", {
        filterPolicy: {
          category: sns.SubscriptionFilter.stringFilter({
            allowlist: ["Electronics", "Books"],
          }),
        },
      })
    );

    //  Lambda Configurations
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
        SQS_URL: catalogItemsQueue.queueUrl,
        SNS_TOPIC_ARN: createProductTopic.topicArn,
      },
      bundling: {
        nodeModules: [
          "@aws-sdk/client-dynamodb",
          "@aws-sdk/client-sqs",
          "@aws-sdk/client-sns",
        ],
      },
    };

    //  Create `catalogBatchProcess` Lambda Function
    const catalogBatchProcess = new lambdaNodejs.NodejsFunction(
      this,
      "CatalogBatchProcessLambda",
      {
        entry: "src/handlers/catalogBatchProcess.js",
        ...lambdaConfig,
      }
    );

    //  Attach SQS Event Source to the Lambda Function
    catalogBatchProcess.addEventSource(
      new eventSources.SqsEventSource(catalogItemsQueue, { batchSize: 5 })
    );

    //  Grant Necessary Permissions
    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantWriteData(catalogBatchProcess);
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);

    //  IAM Role for Lambda to Interact with SNS & SQS
    catalogBatchProcess.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sqs:SendMessage", "sns:Publish"],
        resources: [catalogItemsQueue.queueArn, createProductTopic.topicArn],
      })
    );
  }
}

module.exports = { ProductServiceStack };
