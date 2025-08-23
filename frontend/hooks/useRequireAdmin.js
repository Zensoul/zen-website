// frontend/hooks/useRequireAdmin.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';

// CHANGE: small local helper to decode JWT so we can read cognito:groups without extra deps
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// CHANGE: normalize groups from JWT (Cognito may send as comma string)
function extractGroupsFromToken() {
  try {
    const t = localStorage.getItem('idToken') || localStorage.getItem('token');
    if (!t || t.split('.').length !== 3) return [];
    const claims = decodeJWT(t);
    const raw = claims?.['cognito:groups'];
    if (!raw) return [];
    return Array.isArray(raw)
      ? raw
      : String(raw)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  } catch {
    return [];
  }
}

export default function useRequireAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, refresh } = useUser();
  const [checked, setChecked] = useState(false);

  // CHANGE: compute admin status using either server role or token groups
  const isAdmin = useMemo(() => {
    if (user?.role === 'admin') return true;
    const groups = extractGroupsFromToken();
    return groups.includes('Admins');
  }, [user]);

  useEffect(() => {
    // Wait for context to settle first to avoid redirect flash
    if (loading) return;

    // CHANGE: if user context isn't set yet, try to refresh once
    if (!user) {
      (async () => {
        try {
          await refresh();
        } finally {
          setChecked(true);
        }
      })();
      return;
    }

    setChecked(true);
  }, [loading, user, refresh]);

  useEffect(() => {
    if (!checked) return;

    // CHANGE: if not admin, kick them out of /admin/* to home (or a 403 page if you have one)
    if (!isAdmin) {
      // optional: preserve redirect back after gaining access
      const safeTo = '/';
      router.replace(safeTo);
    }
  }, [checked, isAdmin, router, pathname]);

  // When this returns true, the admin layout can render children safely.
  return checked && isAdmin;
}
