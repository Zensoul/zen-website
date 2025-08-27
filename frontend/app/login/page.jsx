// frontend/app/login/page.jsx
// NOTE: This file is a SERVER component (no 'use client').
// It can safely export route config and read searchParams.

import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic'; // prevent SSG/ISR for this route
export const revalidate = 0;            // explicit: do not cache

export default function Page({ searchParams }) {
  // Read ?next=... on the server
  const nextFromQuery = typeof searchParams?.next === 'string' && searchParams.next.length
    ? searchParams.next
    : '/';

  return <LoginClient nextFromQuery={nextFromQuery} />;
}
