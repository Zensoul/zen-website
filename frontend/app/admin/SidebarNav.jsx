// frontend/components/admin/SidebarNav.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/counsellors", label: "Counsellors" },
];

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="p-4 space-y-1">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`block px-3 py-2 rounded-lg ${active ? "bg-black text-white" : "hover:bg-gray-100"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
