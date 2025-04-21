#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { AuthorizationServiceStack } = require('../lib/authorization_service-stack');

const app = new cdk.App();
new AuthorizationServiceStack(app, 'AuthorizationServiceStack');
