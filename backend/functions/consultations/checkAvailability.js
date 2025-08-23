// File: backend/functions/consultations/checkAvailability.js

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const doc = new AWS.DynamoDB.DocumentClient()

const TABLE = process.env.CONSULTATIONS_TABLE || 'ZenConsultations'

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json',
}

function buildTimeSlots(start = '09:00', end = '20:45', stepMin = 15) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const slots = []
  for (let t = sh * 60 + sm; t <= eh * 60 + em; t += stepMin) {
    const hh = String(Math.floor(t / 60)).padStart(2, '0')
    const mm = String(t % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}
const ALL_SLOTS = buildTimeSlots()

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const qs = event.queryStringParameters || {}
    const date = qs.date
    if (!date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing date (YYYY-MM-DD)' }),
      }
    }

    const res = await doc
      .query({
        TableName: TABLE,
        IndexName: 'DateIndex',
        KeyConditionExpression: '#d = :d',
        ExpressionAttributeNames: { '#d': 'date', '#t': 'time' },
        ExpressionAttributeValues: { ':d': date },
        ProjectionExpression: '#t',
      })
      .promise()

    const booked = (res.Items || []).map((it) => it.time)
    const available = ALL_SLOTS.filter((s) => !booked.includes(s))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ date, booked, available }),
    }
  } catch (err) {
    console.error('Consult availability error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}
