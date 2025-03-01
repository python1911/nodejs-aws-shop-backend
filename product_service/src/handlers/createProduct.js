// product_service/src/handlers/createProduct.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    if (!data.title || typeof data.price !== 'number') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid product data. Ensure title and price are provided.' }),
      };
    }

    const productId = uuidv4();
    const productItem = {
      id: productId,
      title: data.title,
      description: data.description || '',
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

    await dynamoDb.transactWrite(transactionParams).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Product created successfully', product: productItem }),
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
