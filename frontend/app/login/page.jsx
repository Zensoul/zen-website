// frontend/app/login/page.jsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useUser } from '@/context/UserContext';

// Prevent prerendering; always render this page dynamically on the server.
export const dynamic = 'force-dynamic';

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();
  const [open, setOpen] = useState(true);

  // Where to go after login
  const next = params?.get('next') || '/';

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
      {/* Keep redirects controlled here; tell modal not to auto-redirect */}
      <AuthModal open={open} onClose={handleClose} skipRedirect />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6 text-gray-500">Loading…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
