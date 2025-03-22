const { handler } = require("../catalogBatchProcess");
const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const mockDynamoDB = mockClient(DynamoDBDocumentClient);
const mockSNS = mockClient(SNSClient);

beforeEach(() => {
  mockDynamoDB.reset();
  mockSNS.reset();
});

test("should process a valid SQS message and publish to SNS", async () => {
  mockDynamoDB.on(PutCommand).resolves({});
  mockSNS.on(PublishCommand).resolves({});

  const mockEvent = {
    Records: [
      { body: JSON.stringify({ title: "Product 1", price: 10, description: "Desc 1", count: 5 }) },
    ],
  };

  await handler(mockEvent);

  expect(mockDynamoDB.send).toHaveBeenCalledWith(expect.any(PutCommand));
  expect(mockSNS.send).toHaveBeenCalledWith(expect.any(PublishCommand));
});
