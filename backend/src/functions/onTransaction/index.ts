
export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  environment: {
    LEDGER_NAME: {Ref: 'LedgerDatabase'},
  },
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn: {'Fn::GetAtt': ['TransactionsTable', 'StreamArn']}
      }
    }
  ],
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: 'qldb:*', // todo: scope this down
      Resource: 'arn:aws:qldb:us-east-1:*:ledger/LedgerDatabase-*' // todo: Figure out why GetAtt Arn doesn't work. Maybe there's no ARN on CF?
      // Resource: {'Fn::GetAtt': ['LedgerDatabase', 'Arn']},
    }
  ],
  timeout: 30
}
