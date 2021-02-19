import 'source-map-support/register';
import { DynamoDBRecord, DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';
import {Transaction} from "../lib/transaction";
import {HIGHSEC_BUYBACK} from "../lib/constants";
import axios from "axios";

const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();

const {TRANSACTIONS_TABLE} = process.env;

const ingestContract: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    const contracts: Transaction[] = event.Records
        .filter((record) => ['INSERT', 'MODIFY'].includes(record.eventName))
        .filter(isHighsecBuybackContract)
        .map((record) => DynamoDB.Converter.unmarshall(record.dynamodb!.NewImage!) as any)
        .filter((contract) => contract.type === 'item_exchange')
        .filter((contract) => contract.status === 'finished')
        .filter((contract) => contract.acceptorId)
        .filter((contract) => contract.assigneeId)
        .map((contract) => {

            const forCorporation = contract.acceptorId === HIGHSEC_BUYBACK;
            const characterId = forCorporation ? contract.issuerId : contract.acceptorId;

            const result: Transaction = {
                characterId,
                transactionId: `contract#${contract.contractId}`,
                type: 'contract',
                forCorporation,
                value: contract.price,
                date: contract['_md'],
                contractId: contract.contractId,
                locationId: contract.startLocationId
            };

            console.log({contract, result});

            return result;
        })

    console.log({contracts});

    for (const contract of contracts) {

        // skip an edge case with odd data
        if (contract.characterId === 0) {
            console.log('Skipping characterId 0', contract);
            continue;
        }

        const charResponse = await axios.get(`https://esi.evetech.net/v4/characters/${contract.characterId}/`);
        if (charResponse.data.corporation_id !== HIGHSEC_BUYBACK) {
            console.log('Skipping invalid corp', charResponse.data);
            continue;
        }

        const existingContract = await DocumentClient.get({
            TableName: TRANSACTIONS_TABLE,
            Key: {
                characterId: contract.characterId,
                transactionId: `contract#${contract.contractId}`
            }
        }).promise();

        if (!existingContract.Item) {
            await DocumentClient.put({
                TableName: TRANSACTIONS_TABLE,
                Item: contract
            }).promise();

            console.log(`Saved new contract ${contract.contractId}`);
        }
    }
}

// TODO: maybe find a suitable place for this and-
//   turn the inline checks (action, commission, reward = ...) into similar functions
function isHighsecBuybackContract(record: DynamoDBRecord) {
    return record.dynamodb.Keys.pk.S === `${HIGHSEC_BUYBACK}` && record.dynamodb.Keys.sk.S.startsWith('contract#');
}

export const main = ingestContract;
