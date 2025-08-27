'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useUser } from '@/context/UserContext';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();
  const [open, setOpen] = useState(true);

  // where to go after login
  const next = params?.get('next') || '/';

  useEffect(() => {
    // If already logged in, route immediately
    if (!user) return;
    if (user.isAdmin) {
      router.replace(next.startsWith('/admin') ? next : '/admin');
    } else {
      router.replace(next && next !== '/admin' ? next : '/dashboard');
    }
  }, [user, next, router]);

  // When modal closes (user may or may not be logged in)
  const handleClose = () => {
    setOpen(false);
    if (user?.isAdmin) {
      router.replace(next.startsWith('/admin') ? next : '/admin');
    } else if (user) {
      router.replace(next && next !== '/admin' ? next : '/dashboard');
    } else {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Keep control of redirect here, so tell modal to skip its own redirect */}
      <AuthModal open={open} onClose={handleClose} skipRedirect />
    </div>
  );
}
