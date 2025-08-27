'use strict';
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.USERS_TABLE || 'ZenUsers';
const { corsHeaders, corsPreflight } = require('../_lib/cors');

function decode(jwt){ try{ const[,p]=(jwt||'').split('.'); return p?JSON.parse(Buffer.from(p.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8')):null }catch{return null} }
function isAdmin(event){ const h=event.headers||{}; const a=h.authorization||h.Authorization||''; if(!a.startsWith('Bearer ')) return false; const c=decode(a.slice(7))||{}; const g=c['cognito:groups']||[]; const arr=Array.isArray(g)?g:String(g||'').split(',').map(s=>s.trim()).filter(Boolean); return arr.includes('Admins') }

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return corsPreflight(event, { methods: 'GET,OPTIONS' });
  const headers = corsHeaders(event, { methods: 'GET,OPTIONS' });

  if (!isAdmin(event)) return { statusCode: 403, headers, body: JSON.stringify({ ok:false, message:'Forbidden: admin only' }) };

  try {
    const res = await dynamo.scan({ TableName: TABLE, Limit: 100 }).promise();
    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, items: res.Items || [] }) };
  } catch (e) {
    console.error('admin/users error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, message:'Internal Server Error' }) };
  }
};
