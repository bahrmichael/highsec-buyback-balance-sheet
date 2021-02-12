import 'source-map-support/register';

import {DynamoDBStreamEvent, DynamoDBStreamHandler} from "aws-lambda";

const reactToTransaction: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  for (const record of event.Records) {
    console.log({record});

    if (!['INSERT', 'MODIFY'].includes(record.eventName)) {
      console.log(`Skipping ${record.eventName}`); // e.g. DELETE
      continue;
    }
  }
}

export const main = reactToTransaction;
