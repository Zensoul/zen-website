'use strict'

const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')

// Ensure AWS_REGION is set by Serverless or default to ap-south-1
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const TABLE = process.env.ASSESSMENTS_TABLE

// CORS-friendly headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}

module.exports.handler = async (event) => {
  console.log('📥 submitAssessment invoked', {
    httpMethod: event.httpMethod,
    path: event.path,
    rawBody: event.body,
  })

  // 1) Respond to CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // 2) Parse JSON
    const body = event.body ? JSON.parse(event.body) : {}
    console.log('🔍 Parsed body:', body)

    const { userId, ...answers } = body
    if (!userId) {
      console.warn('⚠️ Missing userId in request')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required field: userId' }),
      }
    }

    // 3) Build DynamoDB item
    const assessmentId = uuidv4()
    const item = {
      assessmentId,
      userId,
      createdAt: new Date().toISOString(),
      answers,
    }

    console.log('💾 Saving to DynamoDB table', TABLE, 'item:', item)
    await dynamoDb.put({
      TableName: TABLE,
      Item: item,
    }).promise()

    // 4) Return success
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ assessmentId }),
    }
  } catch (err) {
    console.error('❌ Assessment submission error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}
