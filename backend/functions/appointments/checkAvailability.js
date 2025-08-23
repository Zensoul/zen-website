// File: functions/appointments/checkAvailability.js

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const docClient = new AWS.DynamoDB.DocumentClient()

const TABLE = process.env.APPOINTMENTS_TABLE

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

  try {
    const qs = event.queryStringParameters || {}

    // UPDATE: accept both spellings; trim to be safe
    const counsellorId = (qs.counsellorId || qs.counselorId || '').trim()
    const date = (qs.date || '').trim()

    if (!counsellorId || !date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'counsellorId and date are required' }),
      }
    }

    // UPDATE: single ExpressionAttributeNames object (previously duplicated and overwritten)
    const params = {
      TableName: TABLE,
      IndexName: 'CounsellorDateSlotIndex',
      KeyConditionExpression: 'counsellorId = :c AND #dt = :d',
      ExpressionAttributeNames: { '#dt': 'date', '#st': 'status' }, // keep both here
      ExpressionAttributeValues: { ':c': counsellorId, ':d': date },
      ProjectionExpression: 'timeSlot, #st', // only fetch what we need
    }

    const result = await docClient.query(params).promise()

    // UPDATE: guard against mixed-case statuses + de-duplicate time slots
    const taken = new Set()
    for (const item of result.Items || []) {
      const status = String(item.status || '').toUpperCase()
      if (status !== 'CANCELLED' && item.timeSlot) {
        taken.add(item.timeSlot)
      }
    }
    const bookedSlots = Array.from(taken)

    // UPDATE: return a single clear key; removed duplicate { slots, bookedSlots }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ bookedSlots }),
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
