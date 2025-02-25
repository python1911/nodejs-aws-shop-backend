// product_service/src/handlers/__tests__/getProductsById.test.js
const { handler } = require('../getProductsById');

describe('getProductsById Lambda', () => {
  it('should return product 1 when productId is 1', async () => {
    const event = { pathParameters: { productId: '1' } };
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const product = JSON.parse(result.body);
    expect(product.id).toBe('1');
  });

  it('should return 404 for an unknown productId', async () => {
    const event = { pathParameters: { productId: 'non-existent' } };
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    const errorResponse = JSON.parse(result.body);
    expect(errorResponse.message).toBe('Product not found');
  });
});
