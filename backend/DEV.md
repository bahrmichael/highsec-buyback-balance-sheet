To develop and deploy this app, you need to set up
a DynamoDB table with a DynamoDB Stream first (in `us-east-1`). 

Supply the stream
ARN when deploying the stack with the environment variable
`INGESTION_STREAM`.

Example:

```
INGESTION_STREAM=arn:aws:dynamodb:us-east-1:xxx:table/xxx/stream/xxx sls deploy
```

Once you deployed the table, and the whole stack, start inserting
data from the file `dev-data.json` into the table that has the stream from above.
Your functions should now be triggered, and new records appear in the TransactionsTable.