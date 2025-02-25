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
  
    const { productId } = event.pathParameters || {};
  
    const product = products.find((p) => p.id === productId);
  
    if (!product) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }
  
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    };
  };
  