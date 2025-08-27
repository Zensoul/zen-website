// File: functions/admin/stats.js
'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });

const dynamo = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE        = process.env.USERS_TABLE        || 'ZenUsers';
const COUNSELLORS_TABLE  = process.env.COUNSELLORS_TABLE  || 'ZenCounsellors';
const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'ZenAppointments';
const ASSESSMENTS_TABLE  = process.env.ASSESSMENTS_TABLE  || 'ZenAssessments';

const { corsHeaders, corsPreflight } = require('../_lib/cors');

/* ----------------------------- utils ----------------------------- */

function todayISODate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Scan with pagination and error isolation
async function safeScanAll(params) {
  const items = [];
  let LastEvaluatedKey;
  try {
    do {
      const out = await dynamo
        .scan({ ...params, ExclusiveStartKey: LastEvaluatedKey })
        .promise();
      if (out?.Items) items.push(...out.Items);
      LastEvaluatedKey = out.LastEvaluatedKey;
    } while (LastEvaluatedKey);
    return { items, error: null };
  } catch (error) {
    console.error('safeScanAll error for', params.TableName, error);
    return { items: [], error };
  }
}

// Count via scan (isolated)
async function safeScanCount(params) {
  const { items, error } = await safeScanAll(params);
  return { count: items.length, error };
}

// BatchGet with chunking (100 keys max) + unprocessed retry
async function safeBatchGet(tableName, keyName, ids) {
  const uniq = Array.from(new Set((ids || []).filter(Boolean)));
  if (!uniq.length) return { map: {}, error: null };

  const chunks = [];
  for (let i = 0; i < uniq.length; i += 100) {
    chunks.push(uniq.slice(i, i + 100));
  }

  const map = {};
  try {
    for (const chunk of chunks) {
      let requestKeys = chunk.map((v) => ({ [keyName]: v }));
      // retry loop for unprocessed keys
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const req = { RequestItems: { [tableName]: { Keys: requestKeys } } };
        const res = await dynamo.batchGet(req).promise();

        const got = res?.Responses?.[tableName] || [];
        for (const it of got) map[it[keyName]] = it;

        const unprocessed = res?.UnprocessedKeys?.[tableName]?.Keys || [];
        if (!unprocessed.length) break;
        requestKeys = unprocessed;
      }
    }
    return { map, error: null };
  } catch (error) {
    console.error('safeBatchGet error for', tableName, keyName, error);
    return { map: {}, error };
  }
}

/* ----------------------------- users ----------------------------- */
/**
 * Return ONLY client users (role === 'USER' or role missing).
 * Output: [{ userId, name, email }]
 */
async function buildClientUsersList() {
  const { items, error } = await safeScanAll({
    TableName: USERS_TABLE,
    // name is reserved → alias; role may not exist on legacy rows
    ProjectionExpression: 'userId, #n, email, #r',
    ExpressionAttributeNames: { '#n': 'name', '#r': 'role' },
  });
  if (error) return { list: [], error };

  const clients = items
    .filter((u) => {
      const roleRaw = u?.role ? String(u.role).trim().toUpperCase() : null;
      return roleRaw === 'USER' || roleRaw === null || roleRaw === undefined;
    })
    .map((u) => ({
      userId: u?.userId || null,
      name: u?.name || u?.email || '—',
      email: u?.email || null,
    }))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  return { list: clients, error: null };
}

/* ------------------------- appointments -------------------------- */

async function listAppointmentsTodayDetailed() {
  const today = todayISODate();

  // Using Scan + Filter (if you add a GSI on date, switch to Query)
  const { items, error } = await safeScanAll({
    TableName: APPOINTMENTS_TABLE,
    FilterExpression: '#d = :today',
    ExpressionAttributeNames: { '#d': 'date' },
    ExpressionAttributeValues: { ':today': today },
    ProjectionExpression:
      'appointmentId, userId, userName, counsellorId, counselorId, counsellorID, counsellorName, counselorName, #d, timeSlot, slot, startTime',
  });
  if (error) return { list: [], error };

  // Collect identifiers for enrichment
  const userIds = items.map((a) => a?.userId).filter(Boolean);

  // Consolidate counsellorId across variants for batch lookups
  const rawCounsellorIds = items.map((a) => a?.counsellorId || a?.counselorId || a?.counsellorID).filter(Boolean);

  // Batch lookups
  const usersMapRes = await safeBatchGet(USERS_TABLE, 'userId', userIds);
  const cByCounsellorIdRes = await safeBatchGet(COUNSELLORS_TABLE, 'counsellorId', rawCounsellorIds);
  const cByIdRes           = await safeBatchGet(COUNSELLORS_TABLE, 'id',            rawCounsellorIds);

  const usersMap = usersMapRes.map || {};
  const cByCounsellorId = cByCounsellorIdRes.map || {};
  const cById = cByIdRes.map || {};

  const warnings = [];
  if (usersMapRes.error) warnings.push(`Users batchGet failed: ${usersMapRes.error.code || 'Error'}`);
  if (cByCounsellorIdRes.error) warnings.push(`Counsellors batchGet (by counsellorId) failed: ${cByCounsellorIdRes.error.code || 'Error'}`);
  if (cByIdRes.error) warnings.push(`Counsellors batchGet (by id) failed: ${cByIdRes.error.code || 'Error'}`);

  // Normalize
  const detailed = items.map((a) => {
    const cId = a?.counsellorId || a?.counselorId || a?.counsellorID || '';
    const user = a?.userId ? usersMap[a.userId] : null;
    const counsellor = cId ? (cByCounsellorId[cId] || cById[cId]) : null;

    const time =
      a?.timeSlot || a?.slot || a?.startTime || '—';

    const cName =
      a?.counsellorName || a?.counselorName || counsellor?.name || '—';

    return {
      appointmentId:
        a?.appointmentId ||
        `${a?.userId || 'u'}-${cId || 'c'}-${time}`,
      userId: a?.userId || null,
      userName: a?.userName || user?.name || user?.email || '—',
      userEmail: user?.email || null,
      counsellorId: cId || null,
      counsellorName: cName,
      date: a?.date || today,
      timeSlot: time,
    };
  });

  detailed.sort((a, b) => String(a.timeSlot).localeCompare(String(b.timeSlot)));

  return { list: detailed, error: warnings.length ? new Error(warnings.join(' | ')) : null, warnings };
}

/* ----------------------------- handler --------------------------- */

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS')
    return corsPreflight(event, { methods: 'GET,OPTIONS' });
  const headers = corsHeaders(event, { methods: 'GET,OPTIONS' });

  const warnings = [];

  try {
    const [
      usersRes,
      counsellorsRes,
      assessmentsRes,
      apptsRes,
    ] = await Promise.all([
      buildClientUsersList(),
      safeScanCount({ TableName: COUNSELLORS_TABLE }),
      safeScanCount({ TableName: ASSESSMENTS_TABLE }),
      listAppointmentsTodayDetailed(),
    ]);

    if (usersRes.error)        warnings.push(`Users scan failed: ${usersRes.error.code || 'Error'}`);
    if (counsellorsRes.error)  warnings.push(`Counsellors scan failed: ${counsellorsRes.error.code || 'Error'}`);
    if (assessmentsRes.error)  warnings.push(`Assessments scan failed: ${assessmentsRes.error.code || 'Error'}`);
    if (apptsRes.error)        warnings.push(`Appointments enrichment: ${apptsRes.error.message || 'Error'}`);
    if (Array.isArray(apptsRes.warnings) && apptsRes.warnings.length) warnings.push(...apptsRes.warnings);

    const stats = {
      // USERS
      users: (usersRes.list || []).length,
      usersList: usersRes.list || [], // [{ userId, name, email }]

      // COUNSELLORS
      counsellors: counsellorsRes.count || 0,

      // APPOINTMENTS TODAY
      appointmentsTodayCount: (apptsRes.list || []).length,
      appointmentsToday: apptsRes.list || [],

      // ASSESSMENTS
      assessments: assessmentsRes.count || 0,

      // optional – FE can log this
      warnings,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, stats }),
    };
  } catch (err) {
    console.error('admin/stats fatal error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, message: 'Internal Server Error' }),
    };
  }
};
