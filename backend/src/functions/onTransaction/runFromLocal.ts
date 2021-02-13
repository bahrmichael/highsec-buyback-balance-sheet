import {reactToTransaction} from "./handler";

const input = {
    Records: []
};

reactToTransaction(input, null, () => console.log('done'));