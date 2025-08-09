// app/dashboard/page.jsx
"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card' // if you don't have, you can replace with a div + classes
import { CalendarDays, User2, MessageSquare, Clock } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev'

export default function DashboardPage() {
  const { user, isAuthenticated } = useUser()
  const [assessments, setAssessments] = useState([])
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Format helpers
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : ''
  const fmtTime = (t) => t || ''

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        // 1) Assessments
        if (!user) return
        const userId = user?.userId || user?.sub
        if (!userId) return

        const aRes = await fetch(`${API_BASE}/assessment`, { cache: 'no-store' })
        const aData = await aRes.json()
        if (!cancelled) setAssessments(Array.isArray(aData?.assessments) ? aData.assessments : [])

        // 2) Appointment (from sessionStorage first for snappy UX)
        try {
          const last = sessionStorage.getItem('lastAppointment')
          if (last) setAppointment(JSON.parse(last))
        } catch {}

        // (Optional) Later: fetch from backend once you add an endpoint
        // const apptRes = await fetch(`${API_BASE}/appointments?userId=${userId}`)
        // const apptData = await apptRes.json()
        // if (!cancelled) setAppointment(apptData?.appointments?.[0] ?? appointment)

      } catch (err) {
        if (!cancelled) setError('Failed to load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [user])

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-gray-900">Please sign in</h2>
        <p className="mt-2 text-gray-600">You need to log in to view your dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6">
        <div className="h-12 w-12 rounded-full border-4 border-gray-300 border-t-[#c9a96a] animate-spin" />
        <h2 className="mt-5 text-lg font-semibold text-gray-900">Loading your personalized dashboard…</h2>
        <p className="mt-1 text-sm text-gray-500">Fetching your assessments & bookings</p>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-[#fdfaf5]">
      {/* Hero / Welcome */}
      <div className="bg-gradient-to-br from-[#fff4da] via-[#fffaf0] to-[#fdfaf5] px-4 pt-8 pb-6 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-[#fff0d1] text-[#8a6b2a] px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow">
            Welcome back
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-serif text-[#2c2c2c]">
            Hi{user?.name ? `, ${user.name}` : ''}. Here’s your progress.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Review your recent assessment and upcoming session.
          </p>
        </div>
      </div>

      <div className="px-4 pb-8 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Appointment Card */}
          <section className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#f3ead6] flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-[#8a6b2a]" />
              </div>
              <h2 className="font-semibold text-gray-900">Upcoming Session</h2>
            </div>

            {appointment ? (
              <div className="p-5 space-y-4">
                <div className="bg-[#faf7f1] border border-[#efe6d3] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <User2 className="h-4 w-4 text-[#c9a96a]" />
                        <span className="font-medium">{appointment.counsellorName}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#c9a96a]" />
                        <span>{appointment.date} • {appointment.timeSlot}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#c9a96a]" />
                        <span>{appointment.sessionType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#c9a96a] font-bold">₹{appointment.fee || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">{appointment.paymentStatus || 'UNPAID'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" className="rounded-full">Reschedule</Button>
                  <Button className="bg-[#c9a96a] text-white hover:bg-[#b3945a] rounded-full">Join / Details</Button>
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm text-gray-500">
                No upcoming sessions found. Once you book, it’ll appear here.
              </div>
            )}
          </section>

          {/* Latest Assessment Card */}
          <section className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#f3ead6] flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-[#8a6b2a]" />
              </div>
              <h2 className="font-semibold text-gray-900">Your Latest Assessment</h2>
            </div>

            {assessments?.length ? (
              <div className="p-5 space-y-4">
                {/** We’ll show the most recent one */}
                <AssessmentPreview a={assessments[0]} />
                <div className="flex justify-end">
                  <Button variant="outline" className="rounded-full">View All</Button>
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm text-gray-500">
                No assessments yet. Start one from the home page to get matched with a therapist.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function AssessmentPreview({ a }) {
  // Shape guess based on your submit payload
  const createdAt = a?.createdAt || a?.timestamp
  const category = a?.category
  const scores = [
    ...(Array.isArray(a?.anxietyResponses) ? [{ label: 'GAD-7', value: sum(a.anxietyResponses) }] : []),
    ...(Array.isArray(a?.depressionResponses) ? [{ label: 'PHQ-9', value: sum(a.depressionResponses) }] : []),
    ...(Array.isArray(a?.audit5) ? [{ label: 'AUDIT-5', value: sum(a.audit5) }] : []),
    ...(Array.isArray(a?.iat10) ? [{ label: 'IAT-10', value: sum(a.iat10) }] : []),
    ...(Array.isArray(a?.dast10) ? [{ label: 'DAST-10', value: a.dast10.filter(Boolean).length }] : []),
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-sm font-medium text-gray-900">{new Date(createdAt || Date.now()).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#fff4da] text-[#8a6b2a] text-xs font-semibold">
            {category || 'Assessment'}
          </span>
        </div>
      </div>

      {scores.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {scores.map(s => (
            <div key={s.label} className="rounded-xl border border-gray-100 bg-[#faf7f1] p-3">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">{s.label}</div>
              <div className="mt-1 text-lg font-bold text-[#2c2c2c]">{s.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600">We couldn’t detect summary scores. Open the full assessment to view details.</p>
      )}

      {/* Teeny details line */}
      {Array.isArray(a?.addictionTypes) && a.addictionTypes.length > 0 && (
        <p className="text-xs text-gray-500">
          Reported: <span className="font-medium text-gray-700">{a.addictionTypes.join(', ')}</span>
        </p>
      )}
    </div>
  )
}

function sum(arr) {
  try { return arr.reduce((acc, n) => acc + (Number(n)||0), 0) } catch { return 0 }
}
