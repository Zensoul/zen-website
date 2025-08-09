// components/FullScreenLoader.jsx
"use client"

export default function FullScreenLoader({ title = "Preparing your dashboard…", subtitle = "Fetching your assessments & bookings" }) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 z-50">
      <div className="h-12 w-12 rounded-full border-4 border-gray-300 border-t-[#c9a96a] animate-spin" />
      <h2 className="mt-5 text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}
