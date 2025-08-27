// app/_Components/QuickConnectModal.jsx
'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { listCounsellors, checkAvailability } from '@/lib/api'

function todayISO() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export default function QuickConnectModal({
  open,
  onClose,
  category,              // optional string filter
  onSelectCounsellor,    // (counsellor) => void
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [items, setItems] = useState([])  // [{counsellor, availableSlots: []}]

  const fetchData = async () => {
    setLoading(true)
    setErr('')
    setItems([])

    try {
      const res = await listCounsellors(category ? { category } : {})
      const all = res?.counsellors || res?.items || []
      const subset = all.slice(0, 20)

      const date = todayISO()
      const ALL_SLOTS = [
        '09:00-09:30','09:30-10:00','10:00-10:30','10:30-11:00',
        '11:00-11:30','11:30-12:00','12:00-12:30','12:30-13:00',
        '15:00-15:30','15:30-16:00','16:00-16:30','16:30-17:00',
        '17:00-17:30','17:30-18:00','18:00-18:30','18:30-19:00',
      ]

      const results = await Promise.all(subset.map(async (c) => {
        const counsellorId = c.counsellorId || c.counselorId || c.id || c._id
        if (!counsellorId) return null
        try {
          const av = await checkAvailability({ counsellorId, date })
          const booked = av?.slots || av?.bookedSlots || []
          const available = ALL_SLOTS.filter(s => !booked.includes(s))
          return available.length ? { counsellor: c, availableSlots: available } : null
        } catch {
          return null
        }
      }))

      setItems(results.filter(Boolean))
    } catch (e) {
      setErr(e?.message || 'Could not load available counsellors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category])

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[1050]">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6">
          <h2 className="text-xl font-bold text-gray-900">Talk to a counsellor now</h2>
          <p className="text-gray-600 text-sm mt-1">
            We’ve looked for therapists with open slots today so you can talk first and decide.
          </p>

          {loading && (
            <div className="mt-6 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-[#c9a96a] animate-spin" />
            </div>
          )}

          {!loading && err && <p className="mt-4 text-red-600">{err}</p>}

          {!loading && !err && (
            <ul className="mt-4 space-y-3 max-h-[55vh] overflow-y-auto">
              {items.map(({ counsellor, availableSlots }) => {
                const key = counsellor.counsellorId || counsellor.counselorId || counsellor.id || counsellor._id || counsellor.email
                const firstSlot = availableSlots[0]
                return (
                  <li key={key} className="border border-gray-200 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{counsellor.name}</p>
                      <p className="text-sm text-gray-600">{counsellor.specialization}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Next available today: <span className="font-medium">{firstSlot}</span>
                      </p>
                    </div>
                    <Button
                      className="bg-[#23785d] text-white hover:bg-[#19634b]"
                      onClick={() => onSelectCounsellor?.(counsellor)}
                    >
                      Talk now
                    </Button>
                  </li>
                )
              })}
              {!items.length && !loading && (
                <li className="text-center text-gray-500 py-8">
                  No immediate availability found today. You can still see full matches or pick a time.
                </li>
              )}
            </ul>
          )}

          <div className="mt-6 text-right">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
