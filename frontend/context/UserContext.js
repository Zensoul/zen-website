// File: context/UserContext.jsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// — inline JWT decode helper to avoid jwt-decode import errors —
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
  } catch (err) {
    console.warn('UserContext: decodeJWT error', err)      // 🔧 Log decode errors
    return null
  }
}

// Create context
export const UserContext = createContext()

// Custom hook for consuming the context
export const useUser = () => useContext(UserContext)

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔧 Log whenever we force a logout
  const logoutUser = () => {
    console.log('UserContext: logoutUser called — clearing token & user')
    localStorage.removeItem('token')
    setUser(null)
  }

  useEffect(() => {
    console.log('UserContext: initializing…')
    const token = localStorage.getItem('token')
    console.log('UserContext: raw token →', token)           // 🔧 Log token value

    // Check shape
    if (token && token.split('.').length === 3) {
      const claims = decodeJWT(token)                        // 🔄 inline decode
      console.log('UserContext: decoded claims →', claims)  // 🔧 Log claims

      if (!claims) {
        console.warn('UserContext: invalid JWT, logging out')
        logoutUser()
      } else if (claims.exp * 1000 <= Date.now()) {
        console.warn(
          'UserContext: token expired at',
          new Date(claims.exp * 1000).toISOString(),
          '— now',
          new Date().toISOString()
        )                                                   // 🔧 Log expiry vs now
        logoutUser()
      } else {
        // 🔄 Normalize to your user shape
        const normalized = {
          userId: claims.sub,
          email: claims.email,
          name: claims.name,
          // add more if needed
        }
        console.log('✅ UserContext: normalized user →', normalized) // 🔧 Log normalized
        setUser(normalized)
      }
    } else {
      console.warn('UserContext: no valid token found, logging out')
      logoutUser()
    }

    setLoading(false)
  }, [])

  const isAuthenticated = !!user
  console.log(
    'UserContext: isAuthenticated →',
    isAuthenticated,
    'loading →',
    loading
  )                                                         // 🔧 Log auth state

  return (
    <UserContext.Provider
      value={{ user, setUser, logoutUser, isAuthenticated, loading }}
    >
      {children}
    </UserContext.Provider>
  )
}
