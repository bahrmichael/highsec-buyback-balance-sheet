
export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  environment: {
    TABLE: {Ref: 'BalanceTable'},
  },
  events: [
    {
      stream: process.env.TRANSACTION_TABLE_STREAM
    }
  ],
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:GetItem'],
      Resource: {'Fn::GetAtt': ['BalanceTable', 'Arn']}
    }
  ],
}
