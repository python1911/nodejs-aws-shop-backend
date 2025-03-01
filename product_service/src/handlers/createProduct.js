const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log("Incoming request:", JSON.stringify(event, null, 2)); // Log incoming request

  try {
    const data = JSON.parse(event.body);

    // Validate required fields
    if (!data.title || typeof data.title !== "string" || typeof data.price !== "number") {
      console.warn("Validation failed:", data);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS, POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "Invalid product data. Ensure title (string) and price (number) are provided." }),
      };
    }

    const productId = uuidv4();
    const productItem = {
      id: productId,
      title: data.title,
      description: data.description || "",
      price: data.price,
    };

    const stockItem = {
      product_id: productId,
      count: data.count !== undefined ? data.count : 0,
    };

    const transactionParams = {
      TransactItems: [
        {
          Put: {
            TableName: process.env.PRODUCTS_TABLE,
            Item: productItem,
          },
        },
        {
          Put: {
            TableName: process.env.STOCKS_TABLE,
            Item: stockItem,
          },
        },
      ],
    };

    console.log("Attempting to create product and stock:", JSON.stringify(transactionParams));

    await dynamoDb.transactWrite(transactionParams).promise();

    console.log("Product created successfully:", JSON.stringify(productItem));

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Product created successfully", product: productItem }),
    };
  } catch (error) {
    console.error("Error creating product:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS, POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
