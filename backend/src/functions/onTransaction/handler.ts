import 'source-map-support/register';

import { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";
import { DynamoDB } from 'aws-sdk';
import { TransactionExecutor } from "amazon-qldb-driver-nodejs";

import { QLDB_DRIVER, updateLedger } from './ledger';
import {Transaction} from "../lib/transaction";
import {COMMISSION_RATE, REWARD_RATE, TRADE_HUB} from "../lib/constants";

type Action = "haul" | "recontract" | "accept";

async function handleContract(entry: Transaction) {
  let action: Action;
  if (entry.forCorporation) {
    action = entry.locationId in TRADE_HUB ? "haul" : "recontract";
  } else {
    action = "accept";
  }

  const transferredIsk = entry.forCorporation ? entry.value : -entry.value;
  const commission = transferredIsk * COMMISSION_RATE;

  const reward = action != "accept" ? entry.value * REWARD_RATE[action] : 0;

  await QLDB_DRIVER.executeLambda(async (txn: TransactionExecutor) => {
    try {
      await updateLedger(txn, action, transferredIsk, entry.transactionId, entry.date, entry.characterId, commission, reward);
    } catch (e) {
      console.error(e);
    }
  });
}

export const reactToTransaction: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {

  const transactions: Transaction[] = event.Records.map(
      (record) => DynamoDB.Converter.unmarshall(record.dynamodb!.NewImage!) as Transaction
    );

  for (const entry of transactions) {
    if (entry.type === 'contract') {
      await handleContract(entry);
    } else {
      console.log('unhandled entry', entry);
    }
  }
}

export const main = reactToTransaction;
