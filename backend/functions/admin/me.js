// functions/admin/me.js
'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'ZenUsers';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

// Light-weight decode (no signature verification). For stricter security,
// verify the JWT against Cognito JWKS. This is sufficient for gating UI
// while your API-level mutations still enforce auth.
function decodeJWT(token) {
  try {
    const [, payload] = token.split('.');
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: 'Missing bearer token' }) };
    }

    const claims = decodeJWT(token);
    if (!claims?.sub) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid token' }) };
    }

    const userId = claims.sub;
    const email = claims.email;

    const res = await dynamo.get({
      TableName: USERS_TABLE,
      Key: { userId },
    }).promise();

    const role = res.Item?.role || 'USER';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ userId, email, role }),
    };
  } catch (err) {
    console.error('admin/me error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};
