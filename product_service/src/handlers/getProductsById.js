const { handler } = require("../getProductsById");
const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const mockDynamoDB = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  mockDynamoDB.reset();
});

test("should return product 1 when productId is 1", async () => {
  mockDynamoDB.on(GetCommand).resolves({ Item: { id: "1", title: "Test Product", price: 10 } });

  const event = { pathParameters: { productId: "1" } };
  const result = await handler(event);

  expect(result.statusCode).toBe(200);
  const product = JSON.parse(result.body);
  expect(product.id).toBe("1");
});

test("should return 404 for an unknown productId", async () => {
  mockDynamoDB.on(GetCommand).resolves({}); // No Item found

  const event = { pathParameters: { productId: "unknown" } };
  const result = await handler(event);

  expect(result.statusCode).toBe(404);
  expect(JSON.parse(result.body).message).toBe("Product not found");
});
