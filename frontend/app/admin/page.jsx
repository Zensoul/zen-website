// frontend/app/admin/page.jsx
"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiGet("/admin/stats")
      .then(setStats)
      .catch((e) => setErr(e.message || "Failed to load"));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      {err && <p className="text-red-600">{err}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <p className="text-gray-500 text-sm">Users</p>
          <p className="text-3xl font-semibold">{stats?.users ?? "—"}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-gray-500 text-sm">Counsellors</p>
          <p className="text-3xl font-semibold">{stats?.counsellors ?? "—"}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-gray-500 text-sm">Appointments</p>
          <p className="text-3xl font-semibold">{stats?.appointments ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
