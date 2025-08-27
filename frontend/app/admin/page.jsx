// frontend/app/admin/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { adminStats } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setErr('');
        const res = await adminStats(); // GET /admin/stats
        const s = res?.stats ?? {};

        // --- normalize for backward compatibility ---
        // Users list (new shape) or fallback to array of names
        const usersList =
          Array.isArray(s.usersList)
            ? s.usersList
            : Array.isArray(s.userNames)
              ? s.userNames.map((name, i) => ({ userId: `u-${i}`, name, email: '' }))
              : [];
        const usersCount = Number.isFinite(s.users) ? s.users : usersList.length;

        // Appointments (new shape) or fallback to count only
        const appts = Array.isArray(s.appointmentsToday) ? s.appointmentsToday : [];
        const apptsCount =
          Number.isFinite(s.appointmentsTodayCount)
            ? s.appointmentsTodayCount
            : Number.isFinite(s.appointmentsToday)
              ? s.appointmentsToday
              : appts.length;

        setStats({
          usersCount,
          usersList,
          counsellors: s.counsellors ?? 0,
          appointmentsTodayCount: apptsCount,
          appointmentsToday: appts,
          assessments: s.assessments ?? 0,
        });
      } catch (e) {
        setErr(e?.message || 'Failed to load');
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderUsers = () => {
    const list = stats?.usersList ?? [];
    if (!list.length) return <p className="text-gray-500">No users yet.</p>;

    const show = list.slice(0, 10);
    const extra = Math.max(0, (stats?.usersCount || list.length) - show.length);

    return (
      <div className="space-y-1">
        <ul className="text-sm divide-y">
          {show.map((u) => (
            <li key={u.userId || `${u.email}-${u.name}`} className="py-1.5">
              <div className="font-medium text-gray-900">{u.name || u.email || '—'}</div>
              {u.email ? <div className="text-gray-500">{u.email}</div> : null}
            </li>
          ))}
        </ul>
        {extra > 0 && (
          <p className="text-xs text-gray-500 mt-1">+{extra} more</p>
        )}
      </div>
    );
  };

  const renderAppointmentsToday = () => {
    const items = stats?.appointmentsToday ?? [];
    if (!items.length) return <p className="text-gray-500">No appointments today.</p>;
    const show = items.slice(0, 8);
    const extra = Math.max(0, (stats?.appointmentsTodayCount || items.length) - show.length);

    return (
      <div className="space-y-1">
        <ul className="text-sm divide-y">
          {show.map((a) => (
            <li
              key={a.appointmentId || `${a.userId}-${a.counsellorId}-${a.timeSlot || ''}`}
              className="py-1.5"
            >
              <div className="font-medium text-gray-900">
                {a.userName || '—'} <span className="text-gray-400">→</span>{' '}
                {a.counsellorName || '—'}
              </div>
              <div className="text-gray-500">
                {a.date || '—'} • {a.timeSlot || '—'}
              </div>
            </li>
          ))}
        </ul>
        {extra > 0 && (
          <p className="text-xs text-gray-500 mt-1">+{extra} more</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {loading && <p className="text-gray-500">Loading…</p>}
      {err && !loading && <p className="text-red-600">{err}</p>}

      {stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* USERS: show names + emails */}
          <div className="rounded-xl border p-4 lg:col-span-2">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-gray-500 text-sm">Users</p>
              <p className="text-sm text-gray-400">{stats.usersCount} total</p>
            </div>
            {renderUsers()}
          </div>

          {/* COUNSELLORS (count) */}
          <div className="rounded-xl border p-4">
            <p className="text-gray-500 text-sm">Counsellors</p>
            <p className="text-3xl font-semibold">{stats.counsellors ?? 0}</p>
          </div>

          {/* ASSESSMENTS (count) */}
          <div className="rounded-xl border p-4">
            <p className="text-gray-500 text-sm">Assessments</p>
            <p className="text-3xl font-semibold">{stats.assessments ?? 0}</p>
          </div>

          {/* APPOINTMENTS TODAY: count + list */}
          <div className="rounded-xl border p-4 lg:col-span-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-gray-500 text-sm">Appointments Today</p>
              <p className="text-sm text-gray-400">
                {stats.appointmentsTodayCount ?? 0} total
              </p>
            </div>
            {renderAppointmentsToday()}
          </div>
        </div>
      ) : (
        !loading && <p className="text-gray-500">No stats available.</p>
      )}
    </div>
  );
}
