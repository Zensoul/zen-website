// functions/admin/seedAdmin.js
'use strict';

const {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-seed-token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const USERS_TABLE = process.env.USERS_TABLE || 'ZenUsers';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Site Admin';
const ADMIN_SEED_TOKEN = process.env.ADMIN_SEED_TOKEN; // required header value

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

function attr(obj, name) {
  const f = (obj.Attributes || []).find(a => a.Name === name);
  return f ? f.Value : undefined;
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Hard gate so this endpoint can't be abused in prod
    const provided = event.headers?.['x-seed-token'] || event.headers?.['X-Seed-Token'];
    if (!ADMIN_SEED_TOKEN || provided !== ADMIN_SEED_TOKEN) {
      return { statusCode: 403, headers, body: JSON.stringify({ message: 'Forbidden' }) };
    }

    // Validate required env vars
    const missing = [];
    if (!USER_POOL_ID) missing.push('COGNITO_USER_POOL_ID');
    if (!ADMIN_EMAIL) missing.push('ADMIN_EMAIL');
    if (!ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');
    if (!USERS_TABLE) missing.push('USERS_TABLE');
    if (missing.length) {
      return { statusCode: 500, headers, body: JSON.stringify({ message: `Missing env: ${missing.join(', ')}` }) };
    }

    // 1) Ensure user exists in Cognito
    let userSub;
    let existed = true;
    try {
      const got = await cognito.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: ADMIN_EMAIL,
      }));
      userSub = attr(got, 'sub');
    } catch (e) {
      existed = false;
    }

    if (!existed) {
      // Create without sending email, then set a permanent password and mark email verified
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: ADMIN_EMAIL,
        UserAttributes: [
          { Name: 'email', Value: ADMIN_EMAIL },
          { Name: 'name', Value: ADMIN_NAME },
          { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: 'SUPPRESS',
      }));

      await cognito.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: ADMIN_EMAIL,
        Password: ADMIN_PASSWORD,
        Permanent: true,
      }));

      // Fetch sub after creation
      const got = await cognito.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: ADMIN_EMAIL,
      }));
      userSub = attr(got, 'sub');
    } else {
      // Make sure name/email_verified are set (idempotent)
      await cognito.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: ADMIN_EMAIL,
        UserAttributes: [
          { Name: 'name', Value: ADMIN_NAME },
          { Name: 'email_verified', Value: 'true' },
        ],
      }));
    }

    if (!userSub) {
      return { statusCode: 500, headers, body: JSON.stringify({ message: 'Could not resolve Cognito sub for admin' }) };
    }

    // 2) Upsert into ZenUsers with role ADMIN
    await dynamo.put({
      TableName: USERS_TABLE,
      Item: {
        userId: userSub,
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        role: 'ADMIN',
        updatedAt: new Date().toISOString(),
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: existed ? 'Admin ensured (already existed)' : 'Admin created',
        userId: userSub,
        email: ADMIN_EMAIL,
        role: 'ADMIN',
      }),
    };
  } catch (err) {
    console.error('seedAdmin error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: err.message || 'Internal Server Error' }) };
  }
};
