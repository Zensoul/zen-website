// File: functions/_lib/auth.js
'use strict'

/**
 * Helpers to read Cognito claims (via API Gateway authorizer)
 * and enforce RBAC using the "cognito:groups" claim.
 *
 * NOTE:
 *  - We rely on API Gateway Cognito Authorizer (as configured in serverless.yml)
 *    so tokens are already verified before Lambda is invoked.
 *  - We still check group membership in-Lambda for defense-in-depth.
 */

function getClaimsFromEvent(event) {
  // API Gateway v1 with Cognito authorizer exposes claims here:
  // event.requestContext.authorizer.claims
  return event?.requestContext?.authorizer?.claims || null
}

function getGroupsFromClaims(claims) {
  if (!claims) return []
  const raw = claims['cognito:groups'] ?? []
  if (Array.isArray(raw)) return raw
  return String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function getUserFromClaims(claims) {
  if (!claims) return null
  return {
    sub: claims.sub,
    email: claims.email || claims['custom:email'] || null,
    name: claims.name || claims['cognito:username'] || null,
    groups: getGroupsFromClaims(claims),
  }
}

/**
 * Throws 403 if the user is not in the required group.
 * Returns the user object (with groups) on success.
 */
function requireGroup(event, groupName) {
  const claims = getClaimsFromEvent(event)
  if (!claims) {
    const err = new Error('Unauthorized: missing claims')
    err.statusCode = 401
    throw err
  }
  const user = getUserFromClaims(claims)
  if (!user.groups.includes(groupName)) {
    const err = new Error(`Forbidden: ${groupName} group required`)
    err.statusCode = 403
    throw err
  }
  return user
}

/** Convenience helper for Admins group */
function requireAdmin(event) {
  return requireGroup(event, 'Admins')
}

module.exports = {
  getClaimsFromEvent,
  getGroupsFromClaims,
  getUserFromClaims,
  requireGroup,
  requireAdmin,
}
