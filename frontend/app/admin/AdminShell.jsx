// frontend/components/admin/AdminShell.jsx
"use client";
import SidebarNav from "./SidebarNav";

export default function AdminShell({ children }) {
  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-white hidden md:block">
        <SidebarNav />
      </aside>
      <div className="flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-4">
          <div className="font-semibold">Admin</div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
