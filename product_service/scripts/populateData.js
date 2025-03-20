const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: 'us-east-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const products = [
  {
    id: uuidv4(),
    title: 'Product One',
    description: 'Description for Product One',
    price: 100,
  },
  {
    id: uuidv4(),
    title: 'Product Two',
    description: 'Description for Product Two',
    price: 200,
  },
];

const stocks = products.map((product) => ({
  product_id: product.id,
  count: Math.floor(Math.random() * 20) + 1,
}));

async function populateTables() {
  try {
    for (const product of products) {
      await dynamoDb.put({ TableName: 'products', Item: product }).promise();
      console.log(`Inserted product: ${product.title}`);
    }
    for (const stock of stocks) {
      await dynamoDb.put({ TableName: 'stocks', Item: stock }).promise();
      console.log(`Inserted stock for product_id: ${stock.product_id}`);
    }
    console.log('Tables populated successfully!');
  } catch (error) {
    console.error('Error populating tables:', error);
  }
}

populateTables();
