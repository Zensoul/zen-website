// functions/admin/counsellors.js
'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });

const { v4: uuidv4 } = require('uuid');
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.COUNSELLORS_TABLE || 'ZenCounsellors';

const { corsHeaders, corsPreflight } = require('../_lib/cors');

// ---- helpers ----
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

function isAdmin(event) {
  const hdr = event.headers || {};
  const auth = hdr.authorization || hdr.Authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  const claims = decodeJwtPayload(auth.slice(7)) || {};
  const raw = claims['cognito:groups'] || [];
  const groups = Array.isArray(raw) ? raw : String(raw || '').split(',').map(s => s.trim()).filter(Boolean);
  return groups.includes('Admins');
}

function parseJSON(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}

function toNumber(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function sanitizeCreate(body) {
  const out = {};
  // pick only allowed keys
  const allow = ['name','email','phone','specialization','bio','photoUrl','experienceYears','languages','active'];
  for (const k of allow) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  // defaults
  if (out.active === undefined) out.active = true;
  if (out.experienceYears !== undefined) out.experienceYears = Number(out.experienceYears) || 0;
  if (Array.isArray(out.languages)) {
    out.languages = out.languages.map(x => String(x)).filter(Boolean);
  }
  return out;
}

function buildUpdateExpression(body) {
  const allow = ['name','email','phone','specialization','bio','photoUrl','experienceYears','languages','active'];
  const sets = [];
  const names = {};
  const values = {};
  for (const k of allow) {
    if (body[k] !== undefined) {
      const nk = `#${k}`;
      const vk = `:${k}`;
      names[nk] = k;
      // coerce a couple of types
      let v = body[k];
      if (k === 'experienceYears') v = Number(v) || 0;
      if (k === 'languages' && Array.isArray(v)) v = v.map(x => String(x)).filter(Boolean);
      sets.push(`${nk} = ${vk}`);
      values[vk] = v;
    }
  }
  if (!sets.length) return null;
  return {
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  };
}

// ---- handler ----
module.exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') return corsPreflight(event, { methods: 'GET,POST,PUT,DELETE,OPTIONS' });

  const headers = corsHeaders(event, { methods: 'GET,POST,PUT,DELETE,OPTIONS' });

  try {
    // Admin gate
    if (!isAdmin(event)) {
      return { statusCode: 403, headers, body: JSON.stringify({ ok: false, message: 'Forbidden: admin only' }) };
    }

    const method = event.httpMethod;

    // -------- GET (list with optional pagination) --------
    if (method === 'GET') {
      const qs = event.queryStringParameters || {};
      const limit = toNumber(qs.limit, 100);
      let ExclusiveStartKey;
      if (qs.lastKey) {
        try { ExclusiveStartKey = JSON.parse(qs.lastKey); } catch { /* ignore */ }
      }

      const params = { TableName: TABLE, Limit: limit };
      if (ExclusiveStartKey) params.ExclusiveStartKey = ExclusiveStartKey;

      // NOTE: simple scan for now; switch to Query + GSI when you add filters
      const res = await dynamo.scan(params).promise();
      const items = res.Items || [];
      const nextKey = res.LastEvaluatedKey ? JSON.stringify(res.LastEvaluatedKey) : null;

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, items, nextKey }) };
    }

    // -------- POST (create) --------
    if (method === 'POST') {
      const body = sanitizeCreate(parseJSON(event.body));
      if (!body.name) {
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, message: 'name is required' }) };
      }
      // optional email/phone validation
      if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, message: 'invalid email' }) };
      }

      const nowIso = new Date().toISOString();
      const counsellorId = body.counsellorId || uuidv4();

      const item = {
        counsellorId,
        createdAt: nowIso,
        updatedAt: nowIso,
        ...body,
      };

      await dynamo.put({ TableName: TABLE, Item: item, ConditionExpression: 'attribute_not_exists(counsellorId)' }).promise();

      return { statusCode: 201, headers, body: JSON.stringify({ ok: true, id: counsellorId, item }) };
    }

    // -------- PUT (update) --------
    if (method === 'PUT') {
      const body = parseJSON(event.body);
      const counsellorId = body.counsellorId || (event.queryStringParameters || {}).counsellorId;
      if (!counsellorId) {
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, message: 'counsellorId is required' }) };
      }

      const updateBits = buildUpdateExpression(body);
      if (!updateBits) {
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, message: 'No updatable fields provided' }) };
      }

      // Always bump updatedAt
      updateBits.UpdateExpression += ', #updatedAt = :updatedAt';
      updateBits.ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
      updateBits.ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const params = {
        TableName: TABLE,
        Key: { counsellorId },
        ...updateBits,
        ConditionExpression: 'attribute_exists(counsellorId)',
        ReturnValues: 'ALL_NEW',
      };

      const res = await dynamo.update(params).promise();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, item: res.Attributes }) };
    }

    // -------- DELETE (delete) --------
    if (method === 'DELETE') {
      const qs = event.queryStringParameters || {};
      const body = parseJSON(event.body);
      const counsellorId = qs.counsellorId || body.counsellorId;
      if (!counsellorId) {
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, message: 'counsellorId is required' }) };
      }

      await dynamo.delete({
        TableName: TABLE,
        Key: { counsellorId },
        ConditionExpression: 'attribute_exists(counsellorId)',
      }).promise();

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: counsellorId }) };
    }

    // -------- Method not allowed --------
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, message: 'Method Not Allowed' }) };
  } catch (err) {
    console.error('admin/counsellors error:', err);
    const msg = err && err.message ? err.message : 'Internal Server Error';
    const status = /ConditionalCheckFailedException/.test(msg) ? 404 : 500;
    return { statusCode: status, headers, body: JSON.stringify({ ok: false, message: msg }) };
  }
};
