// File: components/AuthModal.jsx
'use client'

import { Dialog } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/lib/api'

// inline JWT decode (payload only; no signature verification)
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

export default function AuthModal({
  open,
  onClose,
  skipRedirect = false
}) {
  const router = useRouter()
  const { setUser } = useUser()

  const [stage, setStage] = useState('login')
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setStage('login')
      setFormData({ name: '', email: '', password: '' })
      setCode('')
      setError('')
    }
  }, [open])

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Signup failed')
      setStage('confirm')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, confirmationCode: code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Confirmation failed')
      setStage('login')
      setCode('')
      setError('✅ Email confirmed! Please log in.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      // Call backend login
      const data = await login({ email: formData.email, password: formData.password })
      // Expect either { token } or { idToken }, we’ll normalize
      const idToken = data?.idToken || data?.token
      if (!idToken) throw new Error('Token not received')

      // Save for the rest of the app (compat-friendly)
      if (typeof window !== 'undefined') {
        localStorage.setItem('idToken', idToken) // many parts of app read this
        localStorage.setItem('token', idToken)   // keep old key too just in case
      }

      // Build user for context
      let isAdmin = false
      let userObj = null

      if (data?.user) {
        const u = data.user
        // data.user.isAdmin is emitted by your backend
        isAdmin = !!u.isAdmin
        userObj = {
          userId: u.userId || u.sub || u.id,
          email: u.email,
          name: u.name,
          isAdmin,
        }
      } else {
        // fallback: decode JWT and derive admin from cognito:groups
        const decoded = decodeJWT(idToken)
        if (!decoded) throw new Error('Invalid token')
        const groupsRaw = decoded['cognito:groups'] || []
        const groups = Array.isArray(groupsRaw)
          ? groupsRaw
          : String(groupsRaw || '').split(',').map(s => s.trim()).filter(Boolean)
        isAdmin = groups.includes('Admins')
        userObj = {
          userId: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          isAdmin,
        }
      }

      setUser(userObj)

      onClose?.()
      if (!skipRedirect) {
        // Redirect based on role
        if (isAdmin) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderForm = () => {
    if (stage === 'login') {
      return (
        <>
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#c9a96a] hover:bg-[#b89256] text-white"
          >
            {loading ? 'Logging in…' : 'Login'}
          </Button>
          <p className="mt-4 text-center text-sm text-gray-600">
            Don’t have an account?{' '}
            <button
              onClick={() => { setStage('signup'); setError('') }}
              className="text-[#c9a96a] font-semibold"
            >
              Sign Up
            </button>
          </p>
        </>
      )
    }
    if (stage === 'signup') {
      return (
        <>
          <Input
            name="name"
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
          />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-[#c9a96a] hover:bg-[#b89256] text-white"
          >
            {loading ? 'Signing up…' : 'Sign Up'}
          </Button>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => { setStage('login'); setError('') }}
              className="text-[#c9a96a] font-semibold"
            >
              Login
            </button>
          </p>
        </>
      )
    }
    // confirm stage
    return (
      <>
        <p className="text-center mb-4">
          Enter the OTP sent to <strong>{formData.email}</strong>
        </p>
        <Input
          type="text"
          placeholder="Confirmation Code"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-[#c9a96a] hover:bg-[#b89256] text-white"
        >
          {loading ? 'Confirming…' : 'Confirm Account'}
        </Button>
      </>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold text-gray-800 text-center mb-4">
            {stage === 'login'
              ? 'Welcome Back'
              : stage === 'signup'
              ? 'Create an Account'
              : 'Confirm Your Email'}
          </Dialog.Title>
          <div className="space-y-4">{renderForm()}</div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
