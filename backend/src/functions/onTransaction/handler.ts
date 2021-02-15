import 'source-map-support/register';

import { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";
import { DynamoDB } from 'aws-sdk';
import { TransactionExecutor } from "amazon-qldb-driver-nodejs";

import { QLDB_DRIVER, updateLedger } from './ledger';
import { HIGHSEC_BUYBACK } from './model_properties';

export const reactToTransaction: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {

  // TODO: Test/fix marshalling (no idea what NewImage! actually is)
  // TODO: make sure it's "player_donation" we need and not like "player_trading" (?)

  const journal: WalletJournalEntry[] = event.Records.map(
      (record) => DynamoDB.Converter.unmarshall(record.dynamodb!.NewImage!) as WalletJournalEntry
    ).filter((entry) => entry.ref_type === "player_donation");

  for (const entry of journal) {

    // TODO: make sure this is actually the correct order of things
    // the docs say first/second party is "inconsistent"
    // my assumption that amount is always positive with first/second as positive direction might be off

    const action: string = entry.first_party_id == HIGHSEC_BUYBACK ? "payment" : "repayment";
    const amount: number = action == "payment" ? -entry.amount : entry.amount;
    const player_id: number = action == "payment" ? entry.first_party_id : entry.second_party_id;

    await QLDB_DRIVER.executeLambda(async (txn: TransactionExecutor) => {
      await updateLedger(txn, action, amount, 0, entry.date, player_id);
    });
  }
}

export const main = reactToTransaction;
