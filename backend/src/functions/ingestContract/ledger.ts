// TODO: Make a lambda layer for this file and model_properties

import { QldbDriver, Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { dom } from "ion-js";

const {LEDGER_NAME} = process.env;
const {LEDGER_TABLE} = process.env;

// TODO: select null ? select '' ? select id? test this real quick
const QLDB_EXISTS: string = `SELECT EXISTS(SELECT null FROM ${LEDGER_TABLE} WHERE id = ?)`;
const QLDB_INSERT: string = `INSERT INTO ${LEDGER_TABLE} SET action = ?, balance = ?, contractId = ?, date = ?, id = ?`;
const QLDB_UPDATE: string = `UPDATE ${LEDGER_TABLE} SET action = ?, balance = balance + ?, contractId = ?, date = ? WHERE id = ?`;

export const QLDB_DRIVER: QldbDriver = new QldbDriver(LEDGER_NAME);

export async function updateLedger(txn: TransactionExecutor, action: string, amount: number, contract_id: number, date: string, player_id: number): Promise<void> {
    var exists: boolean;
    // TODO: I did test this but you might want to double check it to verify
    await txn.execute(QLDB_EXISTS, player_id).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        exists = resultList.values[0] != 1;
    })

    const statement = exists ? QLDB_UPDATE : QLDB_INSERT;

    // TODO: look at batching these (?)
    await txn.execute(statement, action, amount, contract_id, date, player_id).then((result: Result) => {
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            console.log(`Ledger fail: ${action}, ${amount}, ${player_id}.`);
        }
        console.log(`Ledger success: ${action}, ${amount}, ${player_id}.`);
      });
  }