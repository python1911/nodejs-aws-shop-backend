const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { v4: uuidv4 } = require("uuid");

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION || "us-east-1" });

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "Products";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "Stocks";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
    console.log("Processing batch event from SQS:", JSON.stringify(event));

    try {
        const putRequests = [];
        for (const record of event.Records) {
            const product = JSON.parse(record.body);

            if (!product.title || !product.price || !product.description || product.count === undefined) {
                console.error("Invalid product data:", product);
                continue;
            }

            const productId = uuidv4();

            const putProductCommand = new PutCommand({
                TableName: PRODUCTS_TABLE,
                Item: { id: productId, ...product }
            });

            const putStockCommand = new PutCommand({
                TableName: STOCKS_TABLE,
                Item: { product_id: productId, count: product.count }
            });

            putRequests.push(docClient.send(putProductCommand));
            putRequests.push(docClient.send(putStockCommand));

            if (SNS_TOPIC_ARN) {
                const publishCommand = new PublishCommand({
                    TopicArn: SNS_TOPIC_ARN,
                    Message: JSON.stringify({ product, message: "New product added!" }),
                });

                putRequests.push(snsClient.send(publishCommand));
            }

            console.log("Product and stock added, SNS message sent:", product);
        }

        await Promise.all(putRequests);
        return { statusCode: 200, body: JSON.stringify({ message: "Batch processed successfully" }) };
    } catch (error) {
        console.error("Error processing batch:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error" }) };
    }
};
