export interface Transaction {
    characterId: number;
    transactionId: string;
    value: number;
    forCorporation: boolean;
    date: string;
    type: string;
    // contract related
    locationId?: number;
    issuerId?: number; // can be character or corporation
    acceptorId?: number; // can be character or corporation
    assigneeId?: number;
    contractId?: number;
}