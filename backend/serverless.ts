import type { AWS } from '@serverless/typescript';

import {ingestContract, reactToTransaction} from './src/functions';

const serverlessConfiguration: AWS = {
  service: 'highsec-logistics-balance-sheet',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  plugins: ['serverless-webpack', 'serverless-iam-roles-per-function'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
  },
  functions: { ingestContract, reactToTransaction },
  resources: {
    Resources: {
      TransactionsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'characterId',
            KeyType: 'HASH'
          }, {
            AttributeName: 'transactionId',
            KeyType: 'RANGE'
          }],
          AttributeDefinitions: [{
            AttributeName: 'characterId',
            AttributeType: 'N'
          }, {
            AttributeName: 'transactionId',
            AttributeType: 'S'
          }]
        }
      },
      BalanceTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'characterId',
            KeyType: 'HASH'
          }],
          AttributeDefinitions: [{
            AttributeName: 'characterId',
            AttributeType: 'N'
          }]
        }
      },
    }
  }
}

module.exports = serverlessConfiguration;