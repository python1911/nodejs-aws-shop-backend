// product_service/src/handlers/getProductsById.js
const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    console.log("Incoming Request:", event);

    const { productId } = event.pathParameters;
    console.log(`Fetching product with ID: ${productId}`);

    // Fetch product from Products table
    const productData = await dynamoDb
      .get({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id: productId },
      })
      .promise();

    if (!productData.Item) {
      console.log(`Product with ID ${productId} not found.`);
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS, GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    // Fetch stock information from Stocks table
    const stockData = await dynamoDb
      .get({
        TableName: process.env.STOCKS_TABLE,
        Key: { product_id: productId },
      })
      .promise();

    const count = stockData.Item ? stockData.Item.count : 0;

    // Construct response with product and stock count
    const productWithStock = { ...productData.Item, count };

    console.log("Returning product:", productWithStock);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productWithStock),
    };
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
