// File: clear-users.js

const AWS = require('aws-sdk')

// ─── Set your AWS region ──────────────────────────────────────────────────────
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })

// You'll need credentials too—either via `aws configure` or env vars:
//   export AWS_ACCESS_KEY_ID=…
//   export AWS_SECRET_ACCESS_KEY=…

const docClient = new AWS.DynamoDB.DocumentClient()
const TABLE = 'ZenUsers'

async function clearTable() {
  let params = { TableName: TABLE }
  do {
    // 1) Scan for a page of items
    const data = await docClient.scan(params).promise()
    if (!data.Items || data.Items.length === 0) {
      break
    }

    // 2) Delete each item in parallel
    await Promise.all(
      data.Items.map(item =>
        docClient
          .delete({ TableName: TABLE, Key: { userId: item.userId } })
          .promise()
      )
    )

    // 3) Continue if there’s more
    params.ExclusiveStartKey = data.LastEvaluatedKey
  } while (params.ExclusiveStartKey)

  console.log('✅ All users deleted from', TABLE)
}

clearTable().catch(err => {
  console.error('❌ Error clearing table:', err)
  process.exit(1)
})
