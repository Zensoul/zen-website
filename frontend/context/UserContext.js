// File: context/UserContext.jsx
'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { me as apiMe, login as apiLogin, logout as apiLogout } from '@/lib/api'

/** inline JWT decode (payload only; no signature verification) */
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return JSON.parse(
      decodeURIComponent(
        json
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    )
  } catch {
    return null
  }
}

export const UserContext = createContext(null)
export const useUser = () => useContext(UserContext)

// ---- token helpers ----
function readToken() {
  if (typeof window === 'undefined') return null
  try {
    // Support legacy keys too
    return (
      localStorage.getItem('idToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('dToken') || // legacy typo, just in case
      null
    )
  } catch {
    return null
  }
}

function writeToken(token) {
  try {
    if (token) {
      localStorage.setItem('idToken', token)
      localStorage.setItem('token', token) // compat
      localStorage.removeItem('dToken')     // clean bad key
    } else {
      localStorage.removeItem('idToken')
      localStorage.removeItem('token')
      localStorage.removeItem('dToken')
    }
  } catch {}
}

// ---- user normalizer ----
function userFromClaims(claims) {
  if (!claims) return null
  const rawGroups = claims['cognito:groups'] || []
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
  const isAdmin = groups.includes('Admins')
  return {
    userId: claims.sub,
    email: claims.email,
    name: claims.name || claims['cognito:username'],
    groups,
    isAdmin,
    role: claims.role || (isAdmin ? 'admin' : 'user'),
  }
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = async () => {
    try {
      await apiLogout() // frontend-only clear in lib/api
    } catch {}
    writeToken(null)
    setUser(null)
  }

  const refresh = async () => {
    // 1) Optimistic local decode (no network if no token)
    const token = readToken()
    if (!token) {
      setUser(null)
      return
    }

    let claims = decodeJWT(token)
    const valid =
      claims && typeof claims.exp === 'number' && claims.exp * 1000 > Date.now()

    if (valid) {
      setUser(userFromClaims(claims))
    } else {
      // token expired/invalid locally → clear and bail (don’t call /auth/me)
      writeToken(null)
      setUser(null)
      return
    }

    // 2) Optional: confirm with backend /auth/me (only if token exists)
    try {
      const me = await apiMe() // lib/api adds Bearer header
      // me is a profile object (not a token); keep local user unless you prefer to trust server fields
      if (me && me.userId) {
        setUser(prev => ({
          ...(prev || {}),
          userId: me.userId,
          email: me.email ?? prev?.email,
          name: me.name ?? prev?.name,
          groups: Array.isArray(me.groups) ? me.groups : prev?.groups || [],
          isAdmin: me.role ? me.role === 'admin' : prev?.isAdmin,
        }))
      }
    } catch (e) {
      // 401/403 → token not accepted server-side; clear and sign-out locally
      writeToken(null)
      setUser(null)
    }
  }

  const login = async ({ email, password }) => {
    // Use API helper (returns { idToken/token, user? })
    const res = await apiLogin({ email, password })
    const idToken = res?.idToken || res?.token
    if (idToken) {
      writeToken(idToken)
      const claims = decodeJWT(idToken)
      if (claims && claims.exp * 1000 > Date.now()) {
        setUser(userFromClaims(claims))
      }
    }
    // Optionally confirm server-side once
    try {
      await refresh()
    } catch {}
    return res
  }

  // Initial bootstrap
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Pre-fill from local token to reduce UI flash
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

    // Sync across tabs
    const onStorage = (e) => {
      if (!e) return
      if (['idToken', 'token', 'dToken'].includes(e.key)) {
        refresh()
      }
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
