// File: backend/scripts/seedCounsellors.js
'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })

const docClient = new AWS.DynamoDB.DocumentClient()
const TABLE = process.env.COUNSELLORS_TABLE || 'ZenCounsellors'

// Load your 10-item JSON array
const counsellors = require('./counsellors.json')

async function seed() {
  console.log(`Seeding ${counsellors.length} counsellors into ${TABLE}…`)
  for (const item of counsellors) {
    try {
      await docClient
        .put({
          TableName: TABLE,
          Item: item,
        })
        .promise()
      console.log(`✓ Inserted ${item.id} – ${item.name}`)
    } catch (err) {
      console.error(`✗ Failed to insert ${item.id} – ${item.name}`, err)
    }
  }
  console.log('Seeding complete.')
}

seed().catch(err => {
  console.error('Seeding script failed:', err)
  process.exit(1)
})
