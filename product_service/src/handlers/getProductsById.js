// product_service/src/handlers/getProductsById.js

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
    const { productId } = event.pathParameters || {};
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.error('Error processing getProductsById:', error);
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
