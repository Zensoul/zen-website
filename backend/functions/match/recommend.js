'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.COUNSELLORS_TABLE || 'ZenCounsellors';

const { corsHeaders, corsPreflight } = require('../_lib/cors');

// -------- helpers ----------
function parseJSON(s) {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}
function arr(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function normalizeLower(v) {
  return arr(v).map(x => String(x).toLowerCase().trim()).filter(Boolean);
}
function safeString(v) { return (v == null) ? '' : String(v); }

// Basic scoring: fit by category/specialization + subSpecializations + language
function scoreCounsellor(c, payload) {
  const category = safeString(payload.category).toLowerCase();

  const spec = safeString(c.specialization).toLowerCase();
  const subs = normalizeLower(c.subSpecializations || c.subspecializations || c.subspeciality || c.subSpeciality);
  const langs = normalizeLower(c.languages);

  const addictionTypes = normalizeLower(payload.addictionTypes);
  const preferredLangs = normalizeLower(payload.preferredLanguages || payload.languages);

  let score = 0;

  // 1) primary match: specialization vs category (very rough mapping)
  //    You can extend this map later.
  const catMap = {
    'addiction': ['addiction', 'substance', 'alcohol', 'drug', 'de-addiction', 'rehab'],
    'anxiety': ['anxiety'],
    'depression': ['depression', 'mood'],
    'teen therapy': ['teen', 'adolescent', 'child'],
    'couples therapy': ['couples', 'marriage', 'relationship'],
  };
  const keys = catMap[category] || [category];
  if (keys.some(k => spec.includes(k))) score += 60;

  // 2) sub-specializations for addiction
  if (category === 'addiction' && addictionTypes.length) {
    // if any subSpecialization contains those terms, add points
    const hit = addictionTypes.some(t => subs.some(s => s.includes(t)));
    if (hit) score += 20;
  }

  // 3) language overlap
  if (preferredLangs.length && langs.length) {
    const overlap = preferredLangs.some(l => langs.includes(l));
    if (overlap) score += 10;
  }

  // 4) bump by experience
  const exp = Number(c.experienceYears) || 0;
  score += Math.min(exp, 10); // cap +10

  return score;
}

function normalizeItem(c) {
  // Standardize output keys so frontend can render reliably
  const counsellorId = c.counsellorId || c.counselorId || c.id || c._id;
  return {
    counsellorId,
    id: counsellorId, // convenience
    name: c.name,
    email: c.email,
    phone: c.phone,
    specialization: c.specialization,
    subSpecializations: c.subSpecializations || c.subspecializations || c.subSpeciality || c.subSpeciality || [],
    experienceYears: Number(c.experienceYears) || 0,
    languages: c.languages || [],
    feePerSessionINR: Number(c.feePerSessionINR || c.fee || 0),
    photoUrl: c.photoUrl || '',
    bio: c.bio || '',
    active: c.active !== false,
  };
}

// -------- handler ----------
module.exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflight(event, { methods: 'POST,OPTIONS' });
  }

  const headers = corsHeaders(event, { methods: 'POST,OPTIONS' });

  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers, body: JSON.stringify({ ok: false, message: 'Method Not Allowed' }) };
    }

    const payload = parseJSON(event.body);

    // minimal input
    const category = safeString(payload.category);
    if (!category) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, message: 'category is required' }) };
    }

    // Pull counsellors (you can add filters later with ScanFilter or GSI)
    const res = await dynamo.scan({ TableName: TABLE }).promise();
    const items = (res.Items || []).filter(x => x && (x.active !== false));

    // Score + sort
    const ranked = items
      .map(c => ({ item: c, score: scoreCounsellor(c, payload) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // top 10
      .map(r => normalizeItem(r.item));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, counsellors: ranked }),
    };
  } catch (err) {
    console.error('match/recommend error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, message: 'Internal Server Error' }) };
  }
};
