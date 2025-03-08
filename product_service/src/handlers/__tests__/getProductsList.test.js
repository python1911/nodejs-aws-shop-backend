// product_service/src/handlers/__tests__/getProductsList.test.js
const { handler } = require('../getProductsList');

describe('getProductsList Lambda', () => {
  it('should return a list of products with statusCode 200', async () => {
    const event = {}; // no specific event required
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
  });
});
