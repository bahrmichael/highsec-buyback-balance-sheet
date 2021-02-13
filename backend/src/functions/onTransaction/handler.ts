import 'source-map-support/register';

const QLDB = require('aws-sdk/clients/qldb');
const ledgerClient = new QLDB();

import {DynamoDBStreamEvent, DynamoDBStreamHandler} from "aws-lambda";

const {LEDGER_NAME} = process.env;

export const reactToTransaction: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  for (const record of event.Records) {
    console.log({record});
  }

  const ledger = await ledgerClient.describeLedger({
    Name: LEDGER_NAME
  }).promise();
  console.log({ledger});
}

export const main = reactToTransaction;
