// File: functions/auth/signup.js

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const cognito = new AWS.CognitoIdentityServiceProvider()

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { name, email, password } = body

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields: name, email, password' }),
      }
    }

    await cognito
      .signUp({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
        ],
      })
      .promise()

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Signup successful. Please check your email to verify your account.',
      }),
    }
  } catch (err) {
    console.error('Signup error:', err)
    const statusCode = err.code === 'UsernameExistsException' ? 409 : 500
    return {
      statusCode,
      headers,
      body: JSON.stringify({ message: err.message || 'Internal Server Error' }),
    }
  }
}
