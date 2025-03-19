module.exports = {
  testEnvironment: "node",
  globals: {
    process: {
      env: {
        AWS_REGION: "us-east-1", // Ensure region is set globally for Jest tests
        PRODUCTS_TABLE: "Products",
        STOCKS_TABLE: "Stocks",
        SNS_TOPIC_ARN: "arn:aws:sns:us-east-1:123456789012:NewProductTopic",
      },
    },
  },
};
