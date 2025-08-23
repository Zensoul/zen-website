// File: context/UserContext.jsx
'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '@/lib/api'

/** inline JWT decode helper (unchanged) */
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export const UserContext = createContext(null)
export const useUser = () => useContext(UserContext)

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // read token from localStorage safely
  const readToken = () => {
    try {
      // UPDATE: prefer idToken (Cognito ID token has cognito:groups); keep 'token' for backward compat
      return localStorage.getItem('idToken') || localStorage.getItem('token') || null
    } catch {
      return null
    }
  }

  // persist token to both keys for compatibility
  const writeToken = (token) => {
    try {
      if (token) {
        // UPDATE: store as idToken (primary) and token (legacy)
        localStorage.setItem('idToken', token)
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('idToken')
        localStorage.removeItem('token')
      }
    } catch {}
  }

  // UPDATE: normalize user incl. groups + isAdmin from JWT claims
  const userFromClaims = (claims) =>
    claims
      ? {
          userId: claims.sub,
          email: claims.email,
          name: claims.name || claims['cognito:username'],
          // groups can be array or comma-separated string
          groups: Array.isArray(claims['cognito:groups'])
            ? claims['cognito:groups']
            : String(claims['cognito:groups'] || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
          isAdmin: (Array.isArray(claims['cognito:groups'])
            ? claims['cognito:groups']
            : String(claims['cognito:groups'] || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
          ).includes('Admins'),
          // keep role for legacy compatibility; derive from isAdmin when absent
          role: (claims.role || ((Array.isArray(claims['cognito:groups'])
            ? claims['cognito:groups']
            : String(claims['cognito:groups'] || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
          ).includes('Admins') ? 'admin' : 'user')),
        }
      : null

  const logout = async () => {
    try {
      await apiPost('/auth/logout') // safe even if backend ignores
    } catch {}
    writeToken(null)
    setUser(null)
  }

  const refresh = async () => {
    // UPDATE: prefer decoding local idToken quickly, then (optionally) confirm with /auth/me if present
    const token = readToken()
    if (token && token.split('.').length === 3) {
      const claims = decodeJWT(token)
      if (claims && claims.exp * 1000 > Date.now()) {
        setUser(userFromClaims(claims))
      } else {
        writeToken(null)
        setUser(null)
      }
    }

    // (Optional) If your backend supports /auth/me with cookies/bearer, keep this; otherwise it will no-op
    try {
      const me = await apiGet('/auth/me')
      if (me && me.idToken) {
        // If backend returns a fresher idToken, store it
        writeToken(me.idToken)
        const claims = decodeJWT(me.idToken)
        if (claims && claims.exp * 1000 > Date.now()) {
          setUser(userFromClaims(claims))
        }
      } else if (me && (me.user || me.email)) {
        // Legacy shape fallback
        setUser((prev) => ({
          ...(prev || {}),
          userId: me._id || me.userId || prev?.userId,
          email: me.email || prev?.email,
          name: me.name || prev?.name,
          role: me.role || prev?.role,
          // UPDATE: do not override groups/isAdmin if already derived from token
        }))
      }
    } catch {
      // ignore — local token state already set above
    }
  }

  const login = async ({ email, password }) => {
    // UPDATE: backend returns idToken (ID token) + user payload incl. isAdmin
    const res = await apiPost('/auth/login', { email, password })
    const idToken = res?.idToken || res?.token // support both shapes
    if (idToken) {
      writeToken(idToken)
      const claims = decodeJWT(idToken)
      if (claims && claims.exp * 1000 > Date.now()) {
        setUser(userFromClaims(claims))
      }
    }
    // Optional confirm with server if you expose /auth/me
    try { await refresh() } catch {}
    return res
  }

  // Initial bootstrap
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // UPDATE: optimistic prefill from idToken (reduces UI flash)
        const t = readToken()
        if (t && t.split('.').length === 3) {
          const claims = decodeJWT(t)
          if (claims && claims.exp * 1000 > Date.now()) {
            mounted && setUser(userFromClaims(claims))
          } else {
            writeToken(null)
          }
        }
        await refresh()
      } finally {
        mounted && setLoading(false)
      }
    })()

    // keep user in sync across tabs
    const onStorage = (e) => {
      if (e.key === 'idToken' || e.key === 'token') refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      mounted = false
      window.removeEventListener('storage', onStorage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      // UPDATE: convenience flags for UI/guards
      isAdmin: !!user?.isAdmin,
      groups: user?.groups || [],
      login,
      logoutUser: logout,
      setUser,
      refresh,
    }),
    [user, loading]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
