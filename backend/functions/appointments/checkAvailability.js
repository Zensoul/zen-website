// functions/appointments/checkAvailability.js
'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const docClient = new AWS.DynamoDB.DocumentClient()

const TABLE = process.env.APPOINTMENTS_TABLE

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // For GET, use queryStringParameters instead of event.body
    const paramsObj = event.queryStringParameters || {}
    const counsellorId = paramsObj.counsellorId
    const date = paramsObj.date

    if (!counsellorId || !date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'counsellorId and date are required' }),
      }
    }

    // Query all appointments for the counsellor on that date
    const params = {
      TableName: TABLE,
      IndexName: 'CounsellorDateSlotIndex',
      KeyConditionExpression: 'counsellorId = :counsellorId AND #dt = :date',
      ExpressionAttributeNames: { '#dt': 'date' },
      ExpressionAttributeValues: { ':counsellorId': counsellorId, ':date': date }
    }

    const result = await docClient.query(params).promise()

    // Collect all booked time slots except cancelled ones
    const bookedSlots = (result.Items || [])
      .filter(item => item.status !== 'CANCELLED')
      .map(item => item.timeSlot)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ slots: bookedSlots })
    }

  } catch (err) {
    console.error('CheckAvailability error', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}
