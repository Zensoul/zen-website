// File: functions/assessment/list.js

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const dynamo = new AWS.DynamoDB.DocumentClient()
const TABLE = process.env.ASSESSMENTS_TABLE

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json',
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const userId = event.queryStringParameters?.userId
  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Missing userId' }),
    }
  }

  try {
    const result = await dynamo
      .query({
        TableName: TABLE,
        IndexName: 'UserIndex',
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': userId },
        ScanIndexForward: false,
      })
      .promise()

    const items = result.Items || []
    return {
      statusCode: 200,
      headers,
      // expose both keys so frontend can read either
      body: JSON.stringify({ items, assessments: items }),
    }
  } catch (err) {
    console.error('List assessments error', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}
