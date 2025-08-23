// frontend/app/admin/layout.jsx
"use client";
import AdminShell from "@/components/admin/AdminShell";
import useRequireAdmin from "@/hooks/useRequireAdmin";

export default function AdminLayout({ children }) {
  const ok = useRequireAdmin(); // redirects if not admin
  if (!ok) return null; // avoid flash

  return <AdminShell>{children}</AdminShell>;
}
