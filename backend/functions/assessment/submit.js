// File: functions/assessmeent/submit.js
// NOTE: keep filename as-is to match your existing deployment; consider renaming to functions/assessment/submit.js

'use strict'

const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')

AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const TABLE = process.env.ASSESSMENTS_TABLE

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {}

    const { userId, ...answers } = body
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required field: userId' }),
      }
    }

    const assessmentId = uuidv4()
    const item = {
      assessmentId,
      userId,
      createdAt: new Date().toISOString(),
      answers,
    }

    await dynamoDb
      .put({
        TableName: TABLE,
        Item: item,
        ConditionExpression: 'attribute_not_exists(assessmentId)',
      })
      .promise()

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ assessmentId }),
    }
  } catch (err) {
    console.error('Assessment submission error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}
