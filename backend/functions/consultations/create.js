// File: backend/functions/consultations/create.js

'use strict'

const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const doc = new AWS.DynamoDB.DocumentClient()

const TABLE = process.env.CONSULTATIONS_TABLE || 'ZenConsultations'

let twilioClient = null
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM
if (TWILIO_SID && TWILIO_AUTH) {
  try {
    twilioClient = require('twilio')(TWILIO_SID, TWILIO_AUTH)
  } catch {}
}

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
}

const pad = (n) => String(n).padStart(2, '0')

function addMinutesHHMM(time, mins) {
  let [h, m] = time.split(':').map(Number)
  m += mins
  h += Math.floor(m / 60)
  m = m % 60
  return `${pad(h)}:${pad(m)}`
}

function nowIST() {
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  const y = ist.getUTCFullYear()
  const m = pad(ist.getUTCMonth() + 1)
  const d = pad(ist.getUTCDate())
  const hh = pad(ist.getUTCHours())
  const mm = pad(ist.getUTCMinutes())
  return { date: `${y}-${m}-${d}`, minutes: Number(hh) * 60 + Number(mm) }
}

function isPastIST(dateStr, timeStr) {
  const now = nowIST()
  if (dateStr < now.date) return true
  if (dateStr > now.date) return false
  const [hh, mm] = timeStr.split(':').map(Number)
  const minutes = hh * 60 + mm
  return minutes <= now.minutes
}

function validSlot(time) {
  const [h, m] = time.split(':').map(Number)
  const minutes = h * 60 + m
  const start = 9 * 60
  const end = 20 * 60 + 45
  if (minutes < start || minutes > end) return false
  return m % 15 === 0
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const {
      name,
      email,
      phone,
      date,
      time,
      notes,
      source = 'faq_consultation',
      topic = 'Free 15-min Consultation',
    } = JSON.parse(event.body || '{}')

    if (!name || !phone || !date || !time) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing required fields' }) }
    }
    if (!validSlot(time)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid slot. Use 15-min steps between 09:00–20:45 IST.' }),
      }
    }
    if (isPastIST(date, time)) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Selected slot is in the past (IST).' }) }
    }

    // Double-booking check (GSI DateIndex: date HASH, time RANGE)
    const exists = await doc
      .query({
        TableName: TABLE,
        IndexName: 'DateIndex',
        KeyConditionExpression: '#d = :d AND #t = :t',
        ExpressionAttributeNames: { '#d': 'date', '#t': 'time' },
        ExpressionAttributeValues: { ':d': date, ':t': time },
        Limit: 1,
      })
      .promise()
    if (exists.Count && exists.Count > 0) {
      return { statusCode: 409, headers, body: JSON.stringify({ message: 'This slot is already booked.' }) }
    }

    const id = uuidv4()
    const endTime = addMinutesHHMM(time, 15)
    const createdAt = new Date().toISOString()
    const item = {
      id,
      date,
      time,
      endTime,
      tz: 'Asia/Kolkata',
      name,
      email: email || null,
      phone,
      topic,
      source,
      notes: notes || null,
      status: 'requested',
      createdAt,
    }

    await doc.put({ TableName: TABLE, Item: item }).promise()

    if (twilioClient && phone && TWILIO_FROM) {
      try {
        await twilioClient.messages.create({
          from: TWILIO_FROM,
          to: phone,
          body: `Thanks ${name}! We received your request for a free 15-min consultation on ${date} at ${time} (IST). We’ll confirm shortly.`,
        })
      } catch (notifyErr) {
        console.error('Twilio notify error:', notifyErr.message)
      }
    }

    return { statusCode: 201, headers, body: JSON.stringify({ id, date, time, endTime, status: 'requested' }) }
  } catch (err) {
    console.error('Create consultation error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Internal Server Error' }) }
  }
}
