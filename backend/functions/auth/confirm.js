// File: functions/auth/confirm.js
'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamo  = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || 'ZenUsers';

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
    const { email, confirmationCode } = JSON.parse(event.body || '{}');

    if (!email || !confirmationCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and confirmation code are required.' }),
      };
    }

    await cognito
      .confirmSignUp({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
      })
      .promise();

    // Try to look up the Cognito user to get sub + name (non-fatal if it fails)
    try {
      // Find user by email
      const found = await cognito
        .listUsers({
          UserPoolId: process.env.COGNITO_USER_POOL_ID, // set in serverless.yml env
          Filter: `email = "${email}"`,
          Limit: 1,
        })
        .promise();

      const u = (found.Users || [])[0];
      const sub = u?.Username || u?.Attributes?.find?.((a) => a.Name === 'sub')?.Value;
      const name =
        u?.Attributes?.find?.((a) => a.Name === 'name')?.Value ||
        email.split('@')[0];

      if (sub) {
        const now = new Date().toISOString();
        await dynamo
          .update({
            TableName: USERS_TABLE,
            Key: { userId: sub },
            UpdateExpression: `
              SET #email = :email,
                  #name = if_not_exists(#name, :name),
                  #role = if_not_exists(#role, :role),
                  #updatedAt = :updatedAt,
                  #createdAt = if_not_exists(#createdAt, :createdAt)
            `,
            ExpressionAttributeNames: {
              '#email': 'email',
              '#name': 'name',
              '#role': 'role',
              '#updatedAt': 'updatedAt',
              '#createdAt': 'createdAt',
            },
            ExpressionAttributeValues: {
              ':email': email,
              ':name': name || null,
              ':role': 'USER',
              ':updatedAt': now,
              ':createdAt': now,
            },
          })
          .promise();
      }
    } catch (seedErr) {
      // Non-fatal: we'll still create on first login if this fails
      console.error('Post-confirm DDB upsert failed (non-fatal):', seedErr);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'User confirmed successfully.' }),
    };
  } catch (error) {
    console.error('Confirm SignUp Error:', error);
    const code = error.code || '';
    const statusCode =
      code === 'CodeMismatchException' ||
      code === 'ExpiredCodeException' ||
      code === 'NotAuthorizedException' ||
      code === 'UserNotFoundException'
        ? 400
        : 500;

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        message: error.message || 'Failed to confirm user',
        code: error.code || 'Error',
      }),
    };
  }
};
