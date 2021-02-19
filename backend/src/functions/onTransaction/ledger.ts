import { QldbDriver, Result, TransactionExecutor } from "amazon-qldb-driver-nodejs";
import { dom } from "ion-js";

const {LEDGER_NAME, TABLE_NAME} = process.env;

const QLDB_EXISTS: string = `SELECT null FROM ${TABLE_NAME} WHERE id = ?`;
const QLDB_INSERT: string = `INSERT INTO ${TABLE_NAME} ?`;
const QLDB_UPDATE: string = `UPDATE ${TABLE_NAME} SET actionType = ?, balance = balance + ?, commissions = commissions + ?, rewards = rewards + ?, transactionId = ?, recordDate = ? WHERE id = ?`;

export const QLDB_DRIVER: QldbDriver = new QldbDriver(LEDGER_NAME);

export async function updateLedger(txn: TransactionExecutor, action: string, contractValue: number, transactionId: string, date: string, characterId: number, commission: number, reward: number): Promise<void> {
    const existsResult: Result = await txn.execute(QLDB_EXISTS, characterId);
    const resultList: dom.Value[] = existsResult.getResultList();
    const exists: boolean = resultList.length > 0;

    console.log({existsResult, resultList, exists});

    const balanceChange = contractValue + commission + reward;

    if (exists) {
        await txn.execute(QLDB_UPDATE, action, balanceChange, commission, reward, transactionId, date, characterId).then((result: Result) => {
            const resultList: dom.Value[] = result.getResultList();
            if (resultList.length === 0) {
                console.log(`Ledger fail: ${action}, ${balanceChange}, ${characterId}.`);
            }
            console.log(`Ledger success: ${action}, ${balanceChange}, ${characterId}.`);
        });
    } else {
        const document: Record<string, any> = {
            actionType: action,
            balance: balanceChange,
            commissions: commission,
            rewards: reward,
            payouts: 0,
            transactionId,
            recordDate: date,
            id: characterId,
        };

        await txn.execute(QLDB_INSERT, document).then((result: Result) => {
            const resultList: dom.Value[] = result.getResultList();
            if (resultList.length === 0) {
                console.log(`Ledger fail: ${action}, ${balanceChange}, ${characterId}.`);
            }
            console.log(`Ledger success: ${action}, ${balanceChange}, ${characterId}.`);
        });
    }
  }