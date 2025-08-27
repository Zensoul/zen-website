// File: functions/auth/signup.js
'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });

const cognito = new AWS.CognitoIdentityServiceProvider();

// Dynamic CORS (Path A)
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://www.zensoulwellness.com',
  'https://zensoulwellness.com',
];
function buildCorsHeaders(event) {
  const reqHeaders = event?.headers || {};
  const originKey = Object.keys(reqHeaders).find((k) => k.toLowerCase() === 'origin');
  const origin = originKey ? reqHeaders[originKey] : '';
  const list = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowlist = list.length ? list : DEFAULT_ALLOWED_ORIGINS;
  const allowOrigin = allowlist.includes(origin) ? origin : allowlist[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    Vary: 'Origin',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  };
}

module.exports.handler = async (event) => {
  const headers = buildCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const password = body.password || '';

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields: name, email, password' }),
      };
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
      .promise();

    // We DO NOT write to DynamoDB here. We'll write after email is confirmed (confirm.js),
    // or on first login (login.js). This ensures only confirmed users end up in ZenUsers.

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Signup successful. Please check your email to verify your account.',
      }),
    };
  } catch (err) {
    console.error('Signup error:', err);
    const statusCode = err.code === 'UsernameExistsException' ? 409 : 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ message: err.message || 'Internal Server Error' }),
    };
  }
};
