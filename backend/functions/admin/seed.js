// path: backend/functions/admin/seed.js
'use strict';

/**
 * Admin Seed (RBAC via Cognito Groups)
 *
 * - Protected at API Gateway with Cognito User Pool authorizer (serverless.yml).
 * - In-Lambda check: requires 'Admins' in cognito:groups.
 * - Optional extra guard via X-Seed-Token (SSM or env).
 * - Creates/ensures an admin profile row in ZenUsers for the **calling Cognito user**.
 *
 * IMPORTANT:
 *   • Do NOT store passwords here. Cognito handles auth; this only seeds profile/meta.
 *   • Make sure serverless.yml sets authorizer and passes claims for /admin/* routes.
 */

const AWS = require('aws-sdk');
const crypto = require('crypto');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });

const ssm = new AWS.SSM();
const ddb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || 'ZenUsers';
const ADMIN_SEED_TOKEN_PATH = process.env.ADMIN_SEED_TOKEN_PATH || '/zen/adminSeedToken';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Seed-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

// ---------- helpers ----------
const normHeader = (event, key) => {
  const h = event.headers || {};
  const found = Object.keys(h).find(k => k.toLowerCase() === key.toLowerCase());
  return found ? h[found] : undefined;
};

// runtime fetch (SSM first, then env fallback)
async function getSeedToken() {
  if (process.env.ADMIN_SEED_TOKEN && process.env.ADMIN_SEED_TOKEN !== 'unset') {
    return process.env.ADMIN_SEED_TOKEN;
  }
  try {
    const res = await ssm.getParameter({
      Name: ADMIN_SEED_TOKEN_PATH,
      WithDecryption: true,
    }).promise();
    return res?.Parameter?.Value || null;
  } catch (e) {
    // If not found in SSM, treat as unset (we'll fail closed)
    return null;
  }
}

function parseClaimsFromAuthorizer(event) {
  // API Gateway (v1) with Cognito authorizer exposes claims here:
  // event.requestContext.authorizer.claims
  const claims = event?.requestContext?.authorizer?.claims || null;
  if (!claims) return null;

  const groupsRaw = claims['cognito:groups'] || '';
  const groups = Array.isArray(groupsRaw)
    ? groupsRaw
    : String(groupsRaw || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

  return {
    sub: claims.sub,
    email: claims.email || claims['custom:email'] || null,
    name: claims.name || claims['cognito:username'] || null,
    groups,
  };
}

// ---------- handler ----------
module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 1) Must have verified claims from API Gateway authorizer
    const caller = parseClaimsFromAuthorizer(event);
    if (!caller) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Unauthorized: missing claims (enable Cognito authorizer)' }),
      };
    }

    // 2) RBAC: require Admins group
    if (!caller.groups.includes('Admins')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ message: 'Forbidden: admin group required' }),
      };
    }

    // 3) Optional extra guard: X-Seed-Token must match (SSM/env)
    const expected = await getSeedToken();
    if (!expected) {
      return { statusCode: 500, headers, body: JSON.stringify({ message: 'Seed token not configured' }) };
    }
    const provided = normHeader(event, 'x-seed-token');
    if (!provided || provided !== expected) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: 'Unauthorized seed' }) };
    }

    // 4) Upsert admin profile row for the calling user (no password stored)
    // Use stable userId derived from Cognito sub
    const adminUserId = caller.sub || `ADMIN#${crypto.createHash('sha256').update(caller.email || 'unknown').digest('hex').slice(0,16)}`;

    // If already exists, just acknowledge
    const getResp = await ddb.get({
      TableName: USERS_TABLE,
      Key: { userId: adminUserId },
    }).promise();

    const now = new Date().toISOString();
    if (getResp.Item) {
      // Ensure role is 'admin' if not set
      if (getResp.Item.role !== 'admin') {
        await ddb.update({
          TableName: USERS_TABLE,
          Key: { userId: adminUserId },
          UpdateExpression: 'SET #r = :admin, updatedAt = :u',
          ExpressionAttributeNames: { '#r': 'role' },
          ExpressionAttributeValues: { ':admin': 'admin', ':u': now },
        }).promise();
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Admin profile already exists', userId: adminUserId }),
      };
    }

    // Create minimal admin profile document
    const adminItem = {
      userId: adminUserId,
      email: caller.email || 'admin@zensoul.local',
      role: 'admin',
      username: caller.name || 'ZenSoul Admin',
      createdAt: now,
      updatedAt: now,
      source: 'seed-admin',
    };

    await ddb.put({
      TableName: USERS_TABLE,
      Item: adminItem,
      ConditionExpression: 'attribute_not_exists(userId)',
    }).promise();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ message: 'Admin profile seeded', userId: adminUserId }),
    };
  } catch (err) {
    console.error('seed admin error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};
