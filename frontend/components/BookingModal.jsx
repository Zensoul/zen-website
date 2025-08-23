// app/components/BookingModal.jsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import PaymentModal from "@/components/PaymentModal"
import { checkAvailability, createAppointment } from "@/lib/api"
import { useUser } from "@/context/UserContext"

function todayPlus(days = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

const ALL_SLOTS = [
  "09:00-09:30",
  "09:30-10:00",
  "10:00-10:30",
  "10:30-11:00",
  "11:00-11:30",
  "11:30-12:00",
  "12:00-12:30",
  "12:30-13:00",
  "15:00-15:30",
  "15:30-16:00",
  "16:00-16:30",
  "16:30-17:00",
  "17:00-17:30",
  "17:30-18:00",
  "18:00-18:30",
  "18:30-19:00",
]

const SESSION_TYPES = [
  { label: "Video", value: "Video" },
  { label: "Audio", value: "Audio" },
  { label: "Chat", value: "Chat" },
  { label: "In-person", value: "In-Person" },
]

export default function BookingModal({ open, onClose, counsellor, user: userProp }) {
  const { user: ctxUser } = useUser()
  const user = userProp || ctxUser

  const [sessionType, setSessionType] = useState("Video")
  const [date, setDate] = useState(todayPlus(1))
  const [bookedSlots, setBookedSlots] = useState([])
  const [slot, setSlot] = useState("")
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [notes, setNotes] = useState("")
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Flow UI
  const [allocating, setAllocating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [appointment, setAppointment] = useState(null)

  // normalize possible ID keys coming from the list API
  const counsellorId = useMemo(
    () =>
      counsellor?.id ||
      counsellor?.counsellorId ||
      counsellor?.counselorId ||
      counsellor?.counsellorID ||
      "",
    [counsellor]
  )

  const fee =
    (counsellor?.fees && counsellor?.fees[sessionType]) ||
    counsellor?.feePerSessionINR ||
    0

  // fetch availability when counsellor/date changes
  useEffect(() => {
    if (!counsellorId || !date) return
    setLoadingSlots(true)
    setBookedSlots([])
    setSlot("")
    checkAvailability({ counsellorId, date })
      .then((data) => {
        // accept either {slots:[]} or {bookedSlots:[]}
        const slots = data?.slots || data?.bookedSlots || []
        setBookedSlots(slots)
      })
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [counsellorId, date])

  const availableSlots = ALL_SLOTS.filter((ts) => !bookedSlots.includes(ts))

  const handleBook = async () => {
    setBooking(true)
    setError("")
    setSuccess("")

    // front-end validation to avoid 400s
    const userId = user?.userId || user?.sub
    const missing = []
    if (!userId) missing.push("userId (login required)")
    if (!counsellorId) missing.push("counsellorId")
    if (!sessionType) missing.push("sessionType")
    if (!date) missing.push("date")
    if (!slot) missing.push("timeSlot")

    if (missing.length) {
      setError(`Missing required field(s): ${missing.join(", ")}`)
      setBooking(false)
      return
    }

    try {
      // payload with common alias fields to satisfy various backends
      const payload = {
        userId,
        userName: user?.name || user?.email || "Anonymous",

        // counsellor identifiers (cover all cases)
        counsellorId,                  // preferred
        counselorId: counsellorId,     // US spelling
        counsellorID: counsellorId,    // legacy capitalisation

        // slot naming (cover all cases)
        timeSlot: slot,
        slot,

        // other fields
        counsellorName: counsellor?.name || "",
        sessionType,
        date,
        fee,
        notes,
        source: "website",
      }

      const resp = await createAppointment(payload)
      const appt = resp?.appointment ?? resp
      setAppointment(appt)

      // allocation spinner -> success popup
      setAllocating(true)
      setTimeout(() => {
        setAllocating(false)
        setShowSuccess(true)
      }, 1500)
    } catch (err) {
      // surface server validation if provided
      const msg =
        err?.payload?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not create appointment."
      setError(msg)
    }
    setBooking(false)
  }

  if (!counsellor) return null

  // Hide the booking dialog entirely while the payment modal is open,
  // so the payment UI can mount above and receive focus/z-index correctly.
  const bookingDialogOpen = open && !paymentOpen

  return (
    <>
      {/* MAIN BOOKING MODAL — high z-index so it sits above sticky/fixed headers */}
      {bookingDialogOpen && (
        <Dialog open={true} onClose={onClose} className="relative z-[1000]">
          <DialogBackdrop className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-3 py-4 sm:p-6">
            <DialogPanel className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="relative px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4 flex-shrink-0">
                <div className="text-center">
                  <span className="inline-block bg-gradient-to-r from-[#c9a96a] to-[#fff8e6] px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-[#725527] shadow mb-2">
                    Book Your Session
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {counsellor?.name || "Therapist"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {counsellor?.specialization || "Counselling"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close"
                  type="button"
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="#725527"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body (scrollable) */}
              <div className="px-4 pb-2 sm:px-6 sm:pb-3 overflow-y-auto flex-1">
                <Label className="mt-1 mb-1 text-[#725527] font-medium text-sm sm:text-base">
                  Session Type
                </Label>

                {/* shadcn radio pattern */}
                <RadioGroup
                  value={sessionType}
                  onValueChange={setSessionType}
                  className="grid grid-cols-2 gap-2"
                >
                  {SESSION_TYPES.map((type) => {
                    const id = `sess-${type.value}`
                    return (
                      <div key={type.value} className="flex items-center gap-2">
                        <RadioGroupItem id={id} value={type.value} />
                        <Label
                          htmlFor={id}
                          className={`px-3 py-1.5 rounded-full border transition cursor-pointer text-sm ${
                            sessionType === type.value
                              ? "bg-[#c9a96a] text-white border-[#bfa05f]"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {type.label}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>

                <Label className="mt-4 mb-1 text-[#725527] font-medium text-sm sm:text-base">
                  Choose Date
                </Label>
                <Input
                  type="date"
                  min={todayPlus(0)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border-gray-200 focus:border-[#c9a96a] shadow"
                />

                <Label className="mt-4 mb-1 text-[#725527] font-medium text-sm sm:text-base">
                  Time Slot
                </Label>
                <div className="flex flex-wrap gap-2">
                  {loadingSlots ? (
                    <div className="w-full text-center text-gray-400">Loading slots…</div>
                  ) : availableSlots.length ? (
                    availableSlots.map((ts) => (
                      <button
                        key={ts}
                        onClick={() => setSlot(ts)}
                        className={`px-3 py-2 rounded-xl border shadow text-sm transition ${
                          slot === ts
                            ? "bg-[#c9a96a] text-white border-[#bfa05f]"
                            : "bg-gray-50 border-gray-200 text-gray-800 hover:bg-[#faf5ed]"
                        }`}
                      >
                        {ts}
                      </button>
                    ))
                  ) : (
                    <div className="w-full text-center text-gray-400">
                      No slots available for this day
                    </div>
                  )}
                </div>

                <div className="mt-4 mb-1 flex items-center justify-between">
                  <Label className="text-[#725527] font-medium text-sm sm:text-base">
                    Fee
                  </Label>
                  <span className="font-semibold text-base sm:text-lg text-[#c9a96a]">
                    ₹{fee}
                  </span>
                </div>

                <Label className="mt-3 mb-1 text-[#725527] font-medium text-sm sm:text-base">
                  Notes <span className="text-gray-400">(optional)</span>
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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

              {/* Allocation overlay spinner */}
              {allocating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-300 border-t-[#c9a96a] animate-spin" />
                  <p className="mt-4 text-[#725527] font-semibold">Allocating your session…</p>
                </div>
              )}
            </DialogPanel>
          </div>
        </Dialog>
      )}

      {/* Success Popup — slightly higher z than booking */}
      <Dialog
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          setPaymentOpen(true) // open payment
        }}
        className="relative z-[1100]"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <DialogPanel className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">Booking successful</h3>
            <p className="mt-2 text-gray-600 text-sm">
              Your session has been scheduled with{" "}
              <span className="font-medium">{counsellor?.name}</span>.
            </p>
            <div className="mt-5">
              <Button
                className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 py-2 rounded-full"
                onClick={() => {
                  setShowSuccess(false)  // close success popup
                  setPaymentOpen(true)   // and open Payment modal
                }}
              >
                Continue to Payment
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Payment Modal (UPI) — rendered while booking modal is hidden */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => {
          setPaymentOpen(false)
          // After closing payment, also close the whole booking flow
          onClose?.()
        }}
        appointment={appointment}
        amount={fee}
      />
    </>
  )
}
