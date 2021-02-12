import 'source-map-support/register';

import {DynamoDBRecord, DynamoDBStreamEvent, DynamoDBStreamHandler} from 'aws-lambda';
import {AttributeValue} from "aws-lambda/trigger/dynamodb-stream";

const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();

const {TRANSACTIONS_TABLE} = process.env;

const HIGHSEC_BUYBACK = 98649014;

interface Contract {
    contractId: number;
    type: string;
    status: string;
    acceptorId: number; // can be character or corporation
    assigneeId: number;
    issuerId: number; // can be character or corporation
    price: number;
    locationId: number;
}

// could be replaced with a dynamodb deserializer
function deserialize(input: { [key: string]: AttributeValue }): Contract {
    return {
        contractId: +input.contractId.N,
        type: input.type.S,
        status: input.status.S,
        acceptorId: +input.acceptorId.N,
        assigneeId: +input.assigneeId.N,
        issuerId: +input.issuerId.N,
        price: +input.price.N,
        locationId: +input.locationId.N,
    };
}

function isHighsecBuybackContract(record: DynamoDBRecord) {
    return record.dynamodb.Keys.pk.S === `${HIGHSEC_BUYBACK}` && record.dynamodb.Keys.sk.S.startsWith('contract#');
}

const ingestContract: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    const contracts: Contract[] = event.Records
        .filter((record) => ['INSERT', 'MODIFY'].includes(record.eventName))
        .filter(isHighsecBuybackContract)
        .map(deserialize)
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

        let balanceChange = forCorporation ? contract.price : -contract.price;
        console.log({ balanceChange, characterId });

        await DocumentClient.put({
            TableName: TRANSACTIONS_TABLE,
            Item: {
                characterId,
                transactionId: `contract#${contract.contractId}`,
                type: 'contract',
                forCorporation,
                price: contract.price,
                balanceChange,
                created: new Date().toISOString(),
            }
        }).promise();

        console.log(`Saved new contract ${contract.contractId}`);
    }
}

export const main = ingestContract;
