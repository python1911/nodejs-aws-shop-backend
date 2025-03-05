const cdk = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const { Construct } = require('constructs');
const path = require('path');

class ProductServiceStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create DynamoDB Tables
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'products',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    const stocksTable = new dynamodb.Table(this, 'StocksTable', {
      tableName: 'stocks',
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
    });

    // Use the "handlers" folder (with package.json) as your Lambda asset source
    const lambdaCodePath = path.join(__dirname, '../src/handlers');

    // Bundling configuration: run npm install and copy all files
    const bundlingConfig = {
      image: lambda.Runtime.NODEJS_22_X.bundlingImage,
      command: [
        'bash', '-c', 
        'npm install && cp -r . /asset-output'
      ],
    };

    // Create Lambda Functions using the bundling configuration
    const getProductsListLambda = new lambda.Function(this, 'GetProductsListLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'getProductsList.handler',
      code: lambda.Code.fromAsset(lambdaCodePath, { bundling: bundlingConfig }),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });

    const getProductsByIdLambda = new lambda.Function(this, 'GetProductsByIdLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'getProductsById.handler',
      code: lambda.Code.fromAsset(lambdaCodePath, { bundling: bundlingConfig }),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });

    const createProductLambda = new lambda.Function(this, 'CreateProductLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'createProduct.handler',
      code: lambda.Code.fromAsset(lambdaCodePath, { bundling: bundlingConfig }),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    });

    // Grant the Lambda functions permission to access the tables
    productsTable.grantReadWriteData(getProductsListLambda);
    productsTable.grantReadWriteData(getProductsByIdLambda);
    productsTable.grantReadWriteData(createProductLambda);
    stocksTable.grantReadWriteData(getProductsListLambda);
    stocksTable.grantReadWriteData(getProductsByIdLambda);
    stocksTable.grantReadWriteData(createProductLambda);

    // Create API Gateway and define routes
    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Product Service API',
    });

    const productsResource = api.root.addResource('products');
    // GET /products
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));
    // POST /products
    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));

    // GET /products/{productId}
    const productResource = productsResource.addResource('{productId}');
    productResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
  }
}

module.exports = { ProductServiceStack };
