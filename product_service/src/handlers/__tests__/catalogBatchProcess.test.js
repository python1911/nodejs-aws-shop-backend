const { mockClient } = require("aws-sdk-client-mock");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { handler } = require("../catalogBatchProcess");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Ensure Jest recognizes TableName for DynamoDB
beforeAll(() => {
    process.env.PRODUCTS_TABLE = "products"; // Ensure table name is set
    process.env.AWS_REGION = "us-east-1"; // Set default AWS region
  });
  

jest.mock("@aws-sdk/lib-dynamodb");
jest.mock("@aws-sdk/client-sns");

const mockDynamoDB = mockClient(DynamoDBDocumentClient);
const mockSNS = mockClient(SNSClient);

describe("catalogBatchProcess Lambda", () => {
  beforeEach(() => {
    mockDynamoDB.reset();
    mockSNS.reset();
  });

  it("should process a valid SQS message and publish to SNS", async () => {
    const mockEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test Product",
            price: 10,
            description: "Test description",
            count: 5,
            category: "Electronics",
          }),
        },
      ],
    };

    mockDynamoDB.on(PutCommand).resolves({});
    mockSNS.on(PublishCommand).resolves({});

    await handler(mockEvent);

    expect(mockDynamoDB.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(mockSNS.send).toHaveBeenCalledWith(expect.any(PublishCommand));
  });

  it("should handle multiple SQS messages successfully", async () => {
    const products = [
      { title: "Product 1", price: 10, description: "Desc 1", count: 100 },
      { title: "Product 2", price: 20, description: "Desc 2", count: 200 },
    ];

    const mockEvent = {
      Records: products.map((product) => ({
        body: JSON.stringify(product),
      })),
    };

    mockDynamoDB.on(PutCommand).resolves({});
    mockSNS.on(PublishCommand).resolves({});

    await handler(mockEvent);

    expect(mockDynamoDB.send).toHaveBeenCalledTimes(2);
    expect(mockSNS.send).toHaveBeenCalledTimes(2);
  });

  it("should return an error if a product is invalid", async () => {
    const invalidProductData = {
      title: "",
      description: "Test Description",
      price: "invalid",
      count: 50,
    };

    const mockEvent = {
      Records: [{ body: JSON.stringify(invalidProductData) }],
    };

    await expect(handler(mockEvent)).rejects.toThrow("Validation Error");
    expect(mockDynamoDB.send).not.toHaveBeenCalled();
    expect(mockSNS.send).not.toHaveBeenCalled();
  });
});
