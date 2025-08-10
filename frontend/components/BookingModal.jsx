"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import PaymentModal from '@/components/PaymentModal' // [NEW] import
import { checkAvailability, createAppointment } from '@/lib/api' // ← NEW

function todayPlus(days = 0) {
  const d = new Date(); d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const ALL_SLOTS = [
  '09:00-09:30','09:30-10:00','10:00-10:30','10:30-11:00',
  '11:00-11:30','11:30-12:00','12:00-12:30','12:30-13:00',
  '15:00-15:30','15:30-16:00','16:00-16:30','16:30-17:00',
  '17:00-17:30','17:30-18:00','18:00-18:30','18:30-19:00'
]

const SESSION_TYPES = [
  { label: "Video", value: "Video" },
  { label: "Audio", value: "Audio" },
  { label: "Chat", value: "Chat" },
  { label: "In-person", value: "In-Person" }
]

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev'

export default function BookingModal({ open, onClose, counsellor, user }) {
  const [sessionType, setSessionType] = useState('Video')
  const [date, setDate] = useState(todayPlus(1))
  const [bookedSlots, setBookedSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // [NEW] UI states for flow
  const [allocating, setAllocating] = useState(false)          // show 2s spinner
  const [showSuccess, setShowSuccess] = useState(false)        // success popup
  const [paymentOpen, setPaymentOpen] = useState(false)        // payment modal
  const [appointment, setAppointment] = useState(null)         // store created appt

  const fee = counsellor?.fees?.[sessionType] || counsellor?.feePerSessionINR || 0

  useEffect(() => {
    if (!counsellor || !date) return
    setLoadingSlots(true)
    setBookedSlots([])
    setSlot('')
    checkAvailability({ counsellorId: counsellor.id, date }) // ← replaced fetch with helper
      .then(data => setBookedSlots(data.slots || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [counsellor, date])
  // --------------------------------


  const availableSlots = ALL_SLOTS.filter(ts => !bookedSlots.includes(ts))

  const handleBook = async () => {
    setBooking(true); setError(''); setSuccess('')
    if (!sessionType || !date || !slot) {
      setError('Please select all fields.')
      setBooking(false); return
    }
    try {
      const payload = {
        userId: user?.userId || user?.sub,
        userName: user?.name,
        counsellorId: counsellor.id,
        counsellorName: counsellor.name,
        sessionType, date, timeSlot: slot, fee, notes,
      }
      // [CHANGE] use API helper instead of raw fetch
      const resp = await createAppointment(payload)
      const appt = resp?.appointment ?? resp
      setAppointment(appt)                                     // [NEW] save for payment screen

      // [NEW] allocation spinner -> success popup
      setAllocating(true)
      setTimeout(() => {
        setAllocating(false)
        setShowSuccess(true)                                   // show success popup
      }, 2000)
    } catch (err) {
      setError(err.message)
    }
    setBooking(false)
  }

  if (!counsellor) return null

  return (
    <>
      {/* MAIN BOOKING MODAL */}
      <Dialog open={open} onClose={onClose} className="z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 flex items-center justify-center px-3 py-4 sm:p-6">
          <DialogPanel
            className="
              relative
              bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full
              max-w-md sm:max-w-lg
              flex flex-col
              max-h-[90vh]
            "
          >
            {/* Header */}
            <div className="relative px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4 flex-shrink-0">
              <div className="text-center">
                <span className="inline-block bg-gradient-to-r from-[#c9a96a] to-[#fff8e6] px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#725527] shadow mb-2">
                  Book Your Session
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{counsellor.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{counsellor.specialization}</p>
              </div>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-gray-100"
                aria-label="Close"
                type="button"
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path stroke="#725527" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body (scrollable) */}
            <div className="px-4 pb-2 sm:px-6 sm:pb-3 overflow-y-auto flex-1">
              <Label className="mt-1 mb-1 text-[#725527] font-medium text-sm sm:text-base">Session Type</Label>
              <RadioGroup value={sessionType} onValueChange={setSessionType} className="flex flex-wrap gap-2">
                {SESSION_TYPES.map(type => (
                  <RadioGroupItem key={type.value} value={type.value} id={type.value} className="peer sr-only">
                    <Label
                      htmlFor={type.value}
                      className={`px-3 py-1.5 rounded-full border transition
                        ${sessionType === type.value
                          ? 'bg-[#c9a96a] text-white border-[#bfa05f]'
                          : 'bg-gray-100 text-gray-700 border-gray-200'}
                        cursor-pointer text-sm`}
                    >
                      {type.label}
                    </Label>
                  </RadioGroupItem>
                ))}
              </RadioGroup>

              <Label className="mt-4 mb-1 text-[#725527] font-medium text-sm sm:text-base">Choose Date</Label>
              <Input
                type="date"
                min={todayPlus(0)}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl border-gray-200 focus:border-[#c9a96a] shadow"
              />

              <Label className="mt-4 mb-1 text-[#725527] font-medium text-sm sm:text-base">Time Slot</Label>
              <div className="flex flex-wrap gap-2">
                {loadingSlots ? (
                  <div className="w-full text-center text-gray-400">Loading slots…</div>
                ) : availableSlots.length ? (
                  availableSlots.map(ts => (
                    <button
                      key={ts}
                      onClick={() => setSlot(ts)}
                      className={`px-3 py-2 rounded-xl border shadow text-sm transition
                        ${slot === ts
                          ? 'bg-[#c9a96a] text-white border-[#bfa05f]'
                          : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-[#faf5ed]'}
                      `}
                    >
                      {ts}
                    </button>
                  ))
                ) : (
                  <div className="w-full text-center text-gray-400">No slots available for this day</div>
                )}
              </div>

              <div className="mt-4 mb-1 flex items-center justify-between">
                <Label className="text-[#725527] font-medium text-sm sm:text-base">Fee</Label>
                <span className="font-semibold text-base sm:text-lg text-[#c9a96a]">₹{fee}</span>
              </div>

              <Label className="mt-3 mb-1 text-[#725527] font-medium text-sm sm:text-base">
                Notes <span className="text-gray-400">(optional)</span>
              </Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Any specific requests or details?"
                className="w-full rounded-xl border-gray-200 focus:border-[#c9a96a] shadow"
              />

              {error && <div className="text-red-500 mt-3 text-sm text-center">{error}</div>}
              {success && <div className="text-green-600 mt-3 text-center font-semibold">{success}</div>}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-white flex justify-end flex-shrink-0">
              <Button
                className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 sm:px-8 py-2 rounded-full font-semibold shadow-xl"
                onClick={handleBook}
                disabled={booking || allocating}
              >
                {booking ? "Booking…" : "Book Appointment"}
              </Button>
            </div>

            {/* [NEW] Allocation overlay spinner */}
            {allocating && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6">
                <div className="h-12 w-12 rounded-full border-4 border-gray-300 border-t-[#c9a96a] animate-spin" />
                <p className="mt-4 text-[#725527] font-semibold">Allocating your session…</p>
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      {/* [NEW] Success Popup */}
      <Dialog open={showSuccess} onClose={() => { setShowSuccess(false); setPaymentOpen(true) }} className="z-[60]">
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">Booking successful</h3>
            <p className="mt-2 text-gray-600 text-sm">
              Your session has been scheduled with <span className="font-medium">{counsellor?.name}</span>.
            </p>
            <div className="mt-5">
              <Button
                className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 py-2 rounded-full"
                onClick={() => { setShowSuccess(false); setPaymentOpen(true) }} // proceed to payment
              >
                Continue to Payment
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* [NEW] Payment Modal (UPI) */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        appointment={appointment}
        amount={fee}
      />
    </>
  )
}
