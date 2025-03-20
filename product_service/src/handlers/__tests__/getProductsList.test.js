const { handler } = require("../getProductsList");
const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// Ensure Jest recognizes TableName for DynamoDB
beforeAll(() => {
  process.env.PRODUCTS_TABLE = "products";
});

const mockDynamoDB = mockClient(DynamoDBDocumentClient);

describe("getProductsList Lambda", () => {
  beforeEach(() => {
    mockDynamoDB.reset();
  });

  it("should return a list of products with statusCode 200", async () => {
    const mockProducts = [
      { id: "1", title: "Product 1", price: 100 },
      { id: "2", title: "Product 2", price: 200 },
    ];

    mockDynamoDB.on(ScanCommand).resolves({ Items: mockProducts });

    const event = {};
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
  });

  it("should return an empty array when there are no products", async () => {
    mockDynamoDB.on(ScanCommand).resolves({ Items: [] });

    const event = {};
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("should handle errors gracefully", async () => {
    mockDynamoDB.on(ScanCommand).rejects(new Error("DynamoDB error"));

    const event = {};
    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Internal Server Error");
  });
});
