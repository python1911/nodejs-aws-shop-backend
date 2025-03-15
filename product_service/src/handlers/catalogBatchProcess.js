const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const sns = new SNSClient({ region: "us-east-1" });

exports.handler = async (event) => {
  console.log("Processing batch event from SQS:", JSON.stringify(event));

  for (const record of event.Records) {
    const product = JSON.parse(record.body);

    try {
      const productParams = {
        TableName: "products",
        Item: {
          id: { S: product.id },
          title: { S: product.title },
          description: { S: product.description },
          price: { N: product.price.toString() },
        },
      };

      await dynamoDB.send(new PutItemCommand(productParams));

      //  Send SNS Notification
      const snsParams = {
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: `New product added: ${product.title}`,
      };

      await sns.send(new PublishCommand(snsParams));
      console.log(`Product ${product.id} added and SNS message sent.`);
    } catch (error) {
      console.error("Error processing product:", error);
    }
  }
};
