// frontend/app/login/page.jsx
import { Suspense } from 'react';
import LoginClient from './LoginClient';

// Always dynamic & uncached so prerender won't trip over client hooks
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LoginPage({ searchParams }) {
  const next = typeof searchParams?.next === 'string' ? searchParams.next : '/';

  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center p-6">Loading…</div>}>
      <LoginClient nextFromQuery={next} />
    </Suspense>
  );
}
