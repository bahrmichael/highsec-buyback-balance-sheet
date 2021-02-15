interface Contract {
    contractId: number;
    type: string;
    status: string;
    acceptorId: number; // can be character or corporation
    assigneeId: number;
    issuerId: number; // can be character or corporation
    price: number;
    locationId: number;
    lastModified: string;
}