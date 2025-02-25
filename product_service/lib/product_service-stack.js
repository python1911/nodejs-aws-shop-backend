
// lib/product_service-stack.js

const { Stack } = require('aws-cdk-lib');
const { Construct } = require('constructs');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const path = require('path');

class ProductServiceStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // 1) Create the getProductsList Lambda
    const getProductsListLambda = new lambda.Function(this, 'getProductsListLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,  
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/handlers')),
      handler: 'getProductsList.handler',
    });

    // 2) Create the getProductsById Lambda
    const getProductsByIdLambda = new lambda.Function(this, 'getProductsByIdLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/handlers')),
      handler: 'getProductsById.handler',
    });

    // 3) Create an API Gateway
    const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service API',
    });

    // 4) Define /products resource
    const productsResource = api.root.addResource('products');

    // GET /products -> getProductsListLambda
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));

    // 5) Define /products/{productId} resource
    const productIdResource = productsResource.addResource('{productId}');
    productIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
  }
}

module.exports = { ProductServiceStack };
