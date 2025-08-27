// frontend/app/login/LoginClient.jsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthModal from '@/components/AuthModal'
import { useUser } from '@/context/UserContext'

export default function LoginClient({ nextFromQuery = '/' }) {
  const router = useRouter()
  const { user } = useUser()
  const [open, setOpen] = useState(true)

  // Decide the redirect target entirely from the server-provided prop
  const next = nextFromQuery || '/'

  useEffect(() => {
    if (!user) return
    if (user.isAdmin) {
      router.replace(next.startsWith('/admin') ? next : '/admin')
    } else {
      router.replace(next && next !== '/admin' ? next : '/dashboard')
    }
  }, [user, next, router])

  const handleClose = () => {
    setOpen(false)
    if (user?.isAdmin) {
      router.replace(next.startsWith('/admin') ? next : '/admin')
    } else if (user) {
      router.replace(next && next !== '/admin' ? next : '/dashboard')
    } else {
      router.replace('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <AuthModal open={open} onClose={handleClose} skipRedirect />
    </div>
  )
}
