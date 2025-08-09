// File: functions/assessment/list.js
'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const dynamo = new AWS.DynamoDB.DocumentClient()
const TABLE = process.env.ASSESSMENTS_TABLE

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
}

module.exports.handler = async (event) => {
  // CORS preflight
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
    const result = await dynamo.query({
      TableName: TABLE,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
      ScanIndexForward: false,  // newest first
    }).promise()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ assessments: result.Items || [] }),
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
