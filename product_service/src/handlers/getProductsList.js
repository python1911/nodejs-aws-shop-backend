// product_service/src/handlers/getProductsList.js

const products = [
  {
    id: '1',
    title: 'Product 1',
    description: 'Description for product 1',
    price: 10,
  },
  {
    id: '2',
    title: 'Product 2',
    description: 'Description for product 2',
    price: 20,
  },
  {
    id: '3',
    title: 'Product 3',
    description: 'Description for product 3',
    price: 30,
  },
];

exports.handler = async (event) => {
  console.log('Incoming event:', event);

  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(products),
    };
  } catch (error) {
    console.error('Error processing getProductsList:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
