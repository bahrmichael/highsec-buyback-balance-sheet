import 'source-map-support/register';

import {DynamoDBStreamEvent, DynamoDBStreamHandler} from "aws-lambda";

const reactToTransaction: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  for (const record of event.Records) {
    console.log({record});
  }
}

export const main = reactToTransaction;
