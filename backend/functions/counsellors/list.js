'use strict'

const AWS = require('aws-sdk')
// This is not strictly required for scan results (already DocumentClient)
// const { unmarshall } = AWS.DynamoDB.Converter 

AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const docClient = new AWS.DynamoDB.DocumentClient()
const TABLE = process.env.COUNSELLORS_TABLE

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
}

module.exports.handler = async (event) => {
  // Log incoming Lambda event
  console.log('--- Incoming event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('[CORS] Preflight OPTIONS request, returning early')
    return { statusCode: 200, headers, body: '' }
  }

  // Grab the category param from query string
  const category = event.queryStringParameters?.category
  console.log('[Query] Category param:', category);

  // Base scan params
  const scanParams = { TableName: TABLE }

  if (category) {
    // Case-insensitive check for "addiction"
    const isAddiction = category.toLowerCase().includes('addiction')
    scanParams.ExpressionAttributeNames = { '#subs': 'subSpecializations' }
    scanParams.ExpressionAttributeValues = { ':aaStep': 'AA 12-Step' }
    scanParams.FilterExpression = isAddiction
      ? 'contains(#subs, :aaStep)'
      : 'NOT contains(#subs, :aaStep)'
    console.log('[Scan Filter] Built filter expression:', scanParams.FilterExpression)
  } else {
    console.log('[Scan Filter] No category param provided. No filter will be applied.')
  }

  // Log final scanParams before scan
  console.log('[DynamoDB] scanParams:', JSON.stringify(scanParams, null, 2));

  try {
    const result = await docClient.scan(scanParams).promise()
    console.log('[DynamoDB] Raw scan result:', JSON.stringify(result, null, 2));
    // result.Items is already plain JS object if using DocumentClient
    const counsellors = result.Items
    console.log('[API] Filtered counsellors count:', counsellors.length)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ counsellors }),
    }
  } catch (err) {
    console.error('[Error] ListCounsellors error', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}
