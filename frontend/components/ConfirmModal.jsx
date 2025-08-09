'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ConfirmModal() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(
        'https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev/auth/confirm',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // ✅ CHANGED: send `confirmationCode` key instead of `code`
          body: JSON.stringify({ email, confirmationCode: code }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message)
      }

      setMessage('✅ Account confirmed. You can now log in.')
    } catch (err) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 border rounded-xl mt-10 shadow">
      <h2 className="text-xl font-semibold mb-4">Confirm Your Email</h2>

      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
      />
      <Input
        type="text"
        placeholder="Confirmation code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mb-4"
      />
      <Button
        className="w-full bg-[#c9a96a] hover:bg-[#b89256] text-white"
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? 'Confirming...' : 'Confirm Account'}
      </Button>

      {message && <p className="text-sm mt-4 text-center">{message}</p>}
    </div>
  )
}
