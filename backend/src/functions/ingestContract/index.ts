
export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  environment: {
    TABLE: {Ref: 'TransactionsTable'},
  },
  events: [
    {
      stream: process.env.INGESTION_STREAM
    }
  ],
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:PutItem'],
      Resource: {'Fn::GetAtt': ['TransactionsTable', 'Arn']}
    }
  ],
}
