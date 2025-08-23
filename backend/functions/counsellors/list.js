// File: functions/counsellors/list.js

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const docClient = new AWS.DynamoDB.DocumentClient()
const TABLE = process.env.COUNSELLORS_TABLE

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

  const category = event.queryStringParameters?.category

  const params = { TableName: TABLE }

  // If category provided, attempt a basic filter:
  //  - exact match on "category"
  //  - or list contains on "subSpecializations"
  if (category) {
    params.FilterExpression =
      '#cat = :c OR contains(#subs, :c)'
    params.ExpressionAttributeNames = {
      '#cat': 'category',
      '#subs': 'subSpecializations',
    }
    params.ExpressionAttributeValues = { ':c': category }
  }

  try {
    const result = await docClient.scan(params).promise()
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ counsellors: result.Items || [] }),
    }
  } catch (err) {
    console.error('ListCounsellors error', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}
