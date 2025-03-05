const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async () => {
  console.log("Incoming request: GET /products");

  try {
    // Scan the products table to retrieve all products
    const productsData = await dynamoDb.scan({
      TableName: process.env.PRODUCTS_TABLE,
    }).promise();

    const products = productsData.Items;

    // For each product, fetch the stock info from the Stocks table
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const stockData = await dynamoDb.get({
          TableName: process.env.STOCKS_TABLE,
          Key: { product_id: product.id },
        }).promise();
        const count = stockData.Item ? stockData.Item.count : 0;
        return { ...product, count };
      })
    );

    console.log("Fetched products list:", JSON.stringify(productsWithStock));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(productsWithStock),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
