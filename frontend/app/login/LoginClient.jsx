// frontend/app/login/LoginClient.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useUser } from '@/context/UserContext';

export default function LoginClient({ nextFromQuery = '/' }) {
  const router = useRouter();
  const { user } = useUser();

  const [open, setOpen] = useState(true);

  // Normalize "next" (from server) for client logic
  const next = useMemo(() => (nextFromQuery || '/'), [nextFromQuery]);

  // If already logged in, route immediately
  useEffect(() => {
    if (!user) return;
    if (user.isAdmin) {
      router.replace(next.startsWith('/admin') ? next : '/admin');
    } else {
      router.replace(next && !next.startsWith('/admin') ? next : '/dashboard');
    }
  }, [user, next, router]);

  // When modal closes (user may or may not be logged in)
  const handleClose = () => {
    setOpen(false);
    if (user?.isAdmin) {
      router.replace(next.startsWith('/admin') ? next : '/admin');
    } else if (user) {
      router.replace(next && !next.startsWith('/admin') ? next : '/dashboard');
    } else {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Keep control of redirect here; tell modal not to auto-redirect */}
      <AuthModal open={open} onClose={handleClose} skipRedirect />
    </div>
  );
}
