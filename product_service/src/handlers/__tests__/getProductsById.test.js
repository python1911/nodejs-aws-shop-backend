const { handler } = require("../getProductsById");
const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

// Ensure Jest recognizes TableName for DynamoDB
beforeAll(() => {
  process.env.PRODUCTS_TABLE = "products"; // Ensure table name is set
  process.env.AWS_REGION = "us-east-1"; // Set default AWS region
});


const mockDynamoDB = mockClient(DynamoDBDocumentClient);

describe("getProductsById Lambda", () => {
  beforeEach(() => {
    mockDynamoDB.reset();
  });

  it("should return product 1 when productId is 1", async () => {
    const mockProduct = { id: "1", title: "Test Product", price: 100 };

    mockDynamoDB.on(GetCommand).resolves({ Item: mockProduct });

    const event = { pathParameters: { productId: "1" } };
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const product = JSON.parse(result.body);
    expect(product.id).toBe("1");
  });

  it("should return 404 for an unknown productId", async () => {
    mockDynamoDB.on(GetCommand).resolves({});

    const event = { pathParameters: { productId: "non-existent" } };
    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const errorResponse = JSON.parse(result.body);
    expect(errorResponse.message).toBe("Product not found");
  });
});
