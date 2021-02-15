import 'source-map-support/register';
import { DynamoDBRecord, DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';
import { TransactionExecutor } from "amazon-qldb-driver-nodejs";

import { QLDB_DRIVER, updateLedger } from './ledger';
import { COMMISSION_RATE, HIGHSEC_BUYBACK, REWARD_RATE, TRADE_HUB } from './model_properties';

const DynamoDB = require('aws-sdk/clients/dynamodb');

const ingestContract: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    const contracts: Contract[] = event.Records
        .filter((record) => ['INSERT', 'MODIFY'].includes(record.eventName))
        .filter(isHighsecBuybackContract)
        .map((record) => DynamoDB.Converter.unmarshall(record.dynamodb!.NewImage!) as Contract)
        .filter((contract) => contract.type === 'item_exchange')
        .filter((contract) => contract.status === 'finished')
        .filter((contract) => contract.acceptorId)
        .filter((contract) => contract.assigneeId);

    console.log({contracts});

    for (const contract of contracts) {

        const forCorporation = contract.acceptorId === HIGHSEC_BUYBACK;
        const characterId = forCorporation ? contract.issuerId : contract.acceptorId;

        // skip an edge case with odd data
        if (characterId === 0) {
            console.log('Skipping characterId 0', contract);
            continue;
        }

        const action = forCorporation ? 
            (contract.locationId in TRADE_HUB ? "haul" : "recontract")
            : "accept";

        const comission = (
            forCorporation ? contract.price : -contract.price
        ) * COMMISSION_RATE;

        const reward = action != "accept" ? contract.price * REWARD_RATE[action] : 0;
        
        await QLDB_DRIVER.executeLambda(async (txn: TransactionExecutor) => {
            await updateLedger(txn, action, comission + reward, contract.contractId, contract.lastModified, characterId);
          });
    }
}

// TODO: maybe find a suitable place for this and-
//   turn the inline checks (action, commission, reward = ...) into similar functions
function isHighsecBuybackContract(record: DynamoDBRecord) {
    return record.dynamodb.Keys.pk.S === `${HIGHSEC_BUYBACK}` && record.dynamodb.Keys.sk.S.startsWith('contract#');
}

export const main = ingestContract;
