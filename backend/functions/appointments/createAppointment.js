// functions/appointments/createAppointment.js
'use strict'

const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const docClient = new AWS.DynamoDB.DocumentClient()

const TABLE = process.env.APPOINTMENTS_TABLE

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const {
      userId, userName,
      counsellorId, counsellorName,
      sessionType, date, timeSlot,
      fee, notes
    } = JSON.parse(event.body || '{}')

    if (!userId || !counsellorId || !date || !timeSlot || !sessionType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields' }),
      }
    }

    // Query for double booking (best practice)
    const paramsCheck = {
      TableName: TABLE,
      IndexName: 'CounsellorDateSlotIndex',
      KeyConditionExpression: 'counsellorId = :counsellorId AND #dt = :date',
      ExpressionAttributeNames: { '#dt': 'date' },
      ExpressionAttributeValues: { ':counsellorId': counsellorId, ':date': date }
    }
    const existing = await docClient.query(paramsCheck).promise()
    if (existing.Items.some(item => item.timeSlot === timeSlot && item.status !== 'CANCELLED')) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'Time slot already booked' }),
      }
    }

    // Save the appointment
    const appointment = {
      id: uuidv4(),
      userId,
      userName,
      counsellorId,
      counsellorName,
      sessionType,
      date,
      timeSlot,
      status: 'PENDING',
      fee: fee || 0,
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString(),
      notes: notes || ''
    }

    await docClient.put({
      TableName: TABLE,
      Item: appointment
    }).promise()

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ appointment })
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
