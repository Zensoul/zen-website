// functions/admin/me.js
'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });

const dynamo = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'ZenUsers';

const { corsHeaders, corsPreflight } = require('../_lib/cors');

// Lightweight JWT payload decode (no signature verification here).
// Your API Gateway/Cognito authorizer should already enforce validity.
function decodeJwtPayload(jwt) {
  try {
    const [, payload] = (jwt || '').split('.');
    if (!payload) return null;
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

module.exports.handler = async (event) => {
  // Always answer preflight with 204 + CORS headers
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflight(event, { methods: 'GET,OPTIONS' });
  }

  const headers = corsHeaders(event, { methods: 'GET,OPTIONS' });

  try {
    // Require Bearer token (Path A: token in Authorization header)
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ ok: false, message: 'Missing bearer token' }) };
    }

    const token = authHeader.slice(7);
    const claims = decodeJwtPayload(token);
    if (!claims?.sub) {
      return { statusCode: 401, headers, body: JSON.stringify({ ok: false, message: 'Invalid token' }) };
    }

    const userId = claims.sub;
    const email = claims.email || null;

    // Derive admin from Cognito groups (preferred)
    const groupsRaw = claims['cognito:groups'] || [];
    const groups = Array.isArray(groupsRaw)
      ? groupsRaw
      : String(groupsRaw || '').split(',').map((s) => s.trim()).filter(Boolean);
    let isAdmin = groups.includes('Admins');

    // Optionally also consult DB role (fallback/override)
    let role = 'USER';
    try {
      const db = await dynamo.get({ TableName: USERS_TABLE, Key: { userId } }).promise();
      if (db?.Item?.role) role = String(db.Item.role).toUpperCase();
      if (role === 'ADMIN') isAdmin = true; // allow DB to grant admin as well
    } catch (e) {
      // Don’t fail the request just because DB read errored—log and continue with token-only auth
      console.error('DDB get error in admin/me:', e);
    }

    // Enforce admin access
    if (!isAdmin) {
      return { statusCode: 403, headers, body: JSON.stringify({ ok: false, message: 'Forbidden: admin only' }) };
    }

    // Success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        userId,
        email,
        role,
        isAdmin,
      }),
    };
  } catch (err) {
    console.error('admin/me error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, message: 'Internal Server Error' }) };
  }
};
