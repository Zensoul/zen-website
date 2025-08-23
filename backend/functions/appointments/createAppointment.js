// File: functions/appointments/createAppointment.js

'use strict'

const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const docClient = new AWS.DynamoDB.DocumentClient()

const TABLE = process.env.APPOINTMENTS_TABLE

// CHANGE: normalized CORS headers and ensured Content-Type is always present
const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const {
      userId,
      userName,
      // CHANGE: accept multiple aliases from the frontend and normalize
      counsellorId: rawCounsellorId,
      counselorId,
      counsellorID,
      counsellorName,
      sessionType,
      date,
      timeSlot: rawTimeSlot,
      slot,
      fee,
      notes,
      source,
    } = JSON.parse(event.body || '{}')

    // CHANGE: normalize aliases into canonical names
    const counsellorId = rawCounsellorId || counselorId || counsellorID
    const timeSlot = rawTimeSlot || slot

    // Basic validation
    const missing = []
    if (!userId) missing.push('userId')
    if (!counsellorId) missing.push('counsellorId')
    if (!sessionType) missing.push('sessionType')
    if (!date) missing.push('date')
    if (!timeSlot) missing.push('timeSlot')
    if (missing.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: `Missing required fields: ${missing.join(', ')}` }),
      }
    }

    // CHANGE: fixed query params; removed duplicate ExpressionAttributeNames bug
    // (previous code defined ExpressionAttributeNames twice which overwrote the first one)
    const existing = await docClient
      .query({
        TableName: TABLE,
        IndexName: 'CounsellorDateSlotIndex',
        KeyConditionExpression: 'counsellorId = :c AND #dt = :d',
        ExpressionAttributeNames: { '#dt': 'date' },
        ExpressionAttributeValues: { ':c': counsellorId, ':d': date },
        ProjectionExpression: 'timeSlot, #st',
        ExpressionAttributeNames: { '#dt': 'date', '#st': 'status' }, // CHANGE: merged names into a single object including #st
      })
      .promise()

    // CHANGE: guard against double booking except when an existing item is CANCELLED
    if (
      (existing.Items || []).some(
        (it) => it.timeSlot === timeSlot && it.status !== 'CANCELLED'
      )
    ) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'Time slot already booked' }),
      }
    }

    // CHANGE: normalize/derive several fields; coerce fee to number; include source
    const appointment = {
      id: uuidv4(),
      userId,
      userName: userName || null,
      counsellorId,
      counsellorName: counsellorName || null,
      sessionType,
      date,
      timeSlot,
      status: 'PENDING',
      fee: Number(fee || 0),
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString(),
      notes: notes || '',
      source: source || 'website',
    }

    await docClient
      .put({
        TableName: TABLE,
        Item: appointment,
        // CHANGE: add safety so we never overwrite an existing appointment id
        ConditionExpression: 'attribute_not_exists(id)',
      })
      .promise()

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ appointment }),
    }
  } catch (err) {
    console.error('CreateAppointment error', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}
