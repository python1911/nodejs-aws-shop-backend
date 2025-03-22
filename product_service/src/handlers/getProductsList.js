const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "Products";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "Stocks";

exports.handler = async () => {
    console.log("Incoming request: GET /products");

    try {
        // Fetch all products
        const productData = await docClient.send(new ScanCommand({ TableName: PRODUCTS_TABLE }));

        // Fetch all stock counts
        const stockData = await docClient.send(new ScanCommand({ TableName: STOCKS_TABLE }));

        const stockMap = (stockData.Items || []).reduce((map, stock) => {
            map[stock.product_id] = stock.count || 0;
            return map;
        }, {});

        // Combine products with stock counts
        const productsWithStock = (productData.Items || []).map(product => ({
            ...product,
            count: stockMap[product.id] || 0
        }));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS, GET",
                "Access-Control-Allow-Headers": "Content-Type",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productsWithStock)
        };
    } catch (error) {
        console.error("Error fetching products:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
