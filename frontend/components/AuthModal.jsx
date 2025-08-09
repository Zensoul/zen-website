// File: components/AuthModal.jsx
'use client'

import { Dialog } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// inline JWT decode (for login stage)
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
  skipRedirect = false  // new prop to control redirect
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      )
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, confirmationCode: code })
        }
      )
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')
      if (!data.token) throw new Error('Token not received')
      const decoded = decodeJWT(data.token)
      if (!decoded) throw new Error('Invalid token')

      localStorage.setItem('token', data.token)
      setUser({ userId: decoded.sub, email: decoded.email, name: decoded.name })

      onClose()
      if (!skipRedirect) {
        router.push('/dashboard')
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
