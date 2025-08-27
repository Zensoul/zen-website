// File: functions/auth/login.js
'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamo  = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || 'ZenUsers';

// === Dynamic CORS helper (Path A: no cookies, credentials = false) ===
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

// Decode payload only (no signature verify)
function decodeJwtPayload(jwt) {
  try {
    const [, payloadB64] = (jwt || '').split('.');
    if (!payloadB64) return null;
    const json = Buffer.from(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Upsert user into DynamoDB
async function upsertUser({ sub, email, name, isAdmin }) {
  if (!sub) return;
  const now = new Date().toISOString();
  const role = isAdmin ? 'ADMIN' : 'USER';
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
        ':email': email || null,
        ':name': name || null,
        ':role': role,
        ':updatedAt': now,
        ':createdAt': now,
      },
    })
    .promise();
}

module.exports.handler = async (event) => {
  const headers = buildCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const email = (body.email || '').trim();
    const password = body.password || '';
    const newPassword = body.newPassword || ''; // for NEW_PASSWORD_REQUIRED
    const mfaCode = body.code || ''; // for SMS_MFA
    const clientId = process.env.COGNITO_CLIENT_ID;

    if (!clientId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          message: 'Server config error: COGNITO_CLIENT_ID missing',
        }),
      };
    }

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and password are required' }),
      };
    }

    // Step 1: Initiate auth
    const initResp = await cognito
      .initiateAuth({
        ClientId: clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: { USERNAME: email, PASSWORD: password },
      })
      .promise();

    // Handle challenges
    if (initResp.ChallengeName) {
      const challenge = initResp.ChallengeName;
      const session = initResp.Session || null;

      // NEW_PASSWORD_REQUIRED
      if (challenge === 'NEW_PASSWORD_REQUIRED') {
        if (newPassword) {
          const done = await cognito
            .respondToAuthChallenge({
              ClientId: clientId,
              ChallengeName: 'NEW_PASSWORD_REQUIRED',
              Session: session,
              ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
            })
            .promise();

          const ar = done.AuthenticationResult || {};
          if (!ar.IdToken) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({
                message: 'Authentication failed after password update',
              }),
            };
          }

          const claims = decodeJwtPayload(ar.IdToken) || {};
          const raw = claims['cognito:groups'] || [];
          const groups = Array.isArray(raw)
            ? raw
            : String(raw || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
          const user = {
            sub: claims.sub,
            email: claims.email || email,
            name: claims.name || claims['cognito:username'] || null,
            groups,
            isAdmin: groups.includes('Admins'),
          };

          // Upsert to DDB (non-fatal)
          try {
            await upsertUser(user);
          } catch (e) {
            console.error('Upsert ZenUsers failed (non-fatal):', e);
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              message: 'Login successful',
              token: ar.IdToken,
              idToken: ar.IdToken,
              accessToken: ar.AccessToken,
              refreshToken: ar.RefreshToken,
              expiresIn: ar.ExpiresIn,
              user,
            }),
          };
        }

        // Ask FE to submit newPassword
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            message: 'Challenge required',
            challenge: 'NEW_PASSWORD_REQUIRED',
            session,
            needs: ['newPassword'],
          }),
        };
      }

      // SMS_MFA
      if (challenge === 'SMS_MFA') {
        if (mfaCode) {
          const done = await cognito
            .respondToAuthChallenge({
              ClientId: clientId,
              ChallengeName: 'SMS_MFA',
              Session: session,
              ChallengeResponses: { USERNAME: email, SMS_MFA_CODE: mfaCode },
            })
            .promise();

          const ar = done.AuthenticationResult || {};
          if (!ar.IdToken) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({
                message: 'Authentication failed after MFA',
              }),
            };
          }

          const claims = decodeJwtPayload(ar.IdToken) || {};
          const raw = claims['cognito:groups'] || [];
          const groups = Array.isArray(raw)
            ? raw
            : String(raw || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
          const user = {
            sub: claims.sub,
            email: claims.email || email,
            name: claims.name || claims['cognito:username'] || null,
            groups,
            isAdmin: groups.includes('Admins'),
          };

          // Upsert to DDB (non-fatal)
          try {
            await upsertUser(user);
          } catch (e) {
            console.error('Upsert ZenUsers failed (non-fatal):', e);
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              message: 'Login successful',
              token: ar.IdToken,
              idToken: ar.IdToken,
              accessToken: ar.AccessToken,
              refreshToken: ar.RefreshToken,
              expiresIn: ar.ExpiresIn,
              user,
            }),
          };
        }

        // Ask FE to submit code
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            message: 'Challenge required',
            challenge: 'SMS_MFA',
            session,
            needs: ['code'],
          }),
        };
      }

      // Other/unknown challenge
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'Challenge required', challenge, session }),
      };
    }

    // No challenge — success
    const ar = initResp.AuthenticationResult || {};
    if (!ar.IdToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Authentication failed' }),
      };
    }

    const claims = decodeJwtPayload(ar.IdToken) || {};
    const raw = claims['cognito:groups'] || [];
    const groups = Array.isArray(raw)
      ? raw
      : String(raw || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    const user = {
      sub: claims.sub,
      email: claims.email || email,
      name: claims.name || claims['cognito:username'] || null,
      groups,
      isAdmin: groups.includes('Admins'),
    };

    // Upsert to DDB (non-fatal)
    try {
      await upsertUser(user);
    } catch (e) {
      console.error('Upsert ZenUsers failed (non-fatal):', e);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        token: ar.IdToken, // for existing FE code
        idToken: ar.IdToken,
        accessToken: ar.AccessToken,
        refreshToken: ar.RefreshToken,
        expiresIn: ar.ExpiresIn,
        user,
      }),
    };
  } catch (err) {
    console.error('Login error:', err);
    const code = err.code || '';
    const statusCode =
      code === 'NotAuthorizedException' ||
      code === 'UserNotConfirmedException' ||
      code === 'PasswordResetRequiredException' ||
      code === 'UserNotFoundException' ||
      code === 'CodeMismatchException'
        ? 401
        : 500;

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        message: err.message || 'Internal Server Error',
        code: code || 'Error',
      }),
    };
  }
};
