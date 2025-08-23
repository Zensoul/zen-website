// File: functions/auth/confirm.js
'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const cognito = new AWS.CognitoIdentityServiceProvider()

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { email, confirmationCode } = JSON.parse(event.body || '{}')

    if (!email || !confirmationCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and confirmation code are required.' }),
      }
    }

    await cognito.confirmSignUp({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    }).promise()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'User confirmed successfully.' }),
    }
  } catch (error) {
    console.error('Confirm SignUp Error:', error)
    const code = error.code || ''
    const statusCode = (
      code === 'CodeMismatchException' ||
      code === 'ExpiredCodeException' ||
      code === 'NotAuthorizedException' ||
      code === 'UserNotFoundException'
    ) ? 400 : 500

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        message: error.message || 'Failed to confirm user',
        code: error.code || 'Error',
      }),
    }
  }
}
