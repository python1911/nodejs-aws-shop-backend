const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "Products";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "Stocks";

exports.handler = async (event) => {
    try {
        console.log("Incoming Request:", event);

        const { productId } = event.pathParameters;
        console.log(`Fetching product with ID: ${productId}`);

        // Fetch product from Products table
        const productResult = await docClient.send(new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { id: productId }
        }));

        if (!productResult.Item) {
            console.log(`Product with ID ${productId} not found.`);
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS, GET",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                body: JSON.stringify({ message: "Product not found" })
            };
        }

        // Fetch stock information from Stocks table
        const stockResult = await docClient.send(new GetCommand({
            TableName: STOCKS_TABLE,
            Key: { product_id: productId }
        }));

        const count = stockResult.Item ? stockResult.Item.count : 0;

        // Construct response with product and stock count
        const productWithStock = { ...productResult.Item, count };

        console.log("Returning product:", productWithStock);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS, GET",
                "Access-Control-Allow-Headers": "Content-Type",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productWithStock)
        };
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
