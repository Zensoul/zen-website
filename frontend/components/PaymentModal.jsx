"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PaymentModal({ open, onClose, appointment, amount }) {
  const router = useRouter()
  const [upiId, setUpiId] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const pay = async () => {
    setError('')
    if (!upiId?.includes('@')) {
      setError('Please enter a valid UPI ID (e.g., name@bank).')
      return
    }
    setProcessing(true)

    // Simulate payment latency
    setTimeout(async () => {
      try {
      // Persist the just-booked appointment so the dashboard can show it immediately
      if (appointment) {
        sessionStorage.setItem('lastAppointment', JSON.stringify(appointment))
      }
    } catch {}
    setProcessing(false)
    onClose()
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <Dialog open={open} onClose={onClose} className="z-[1200]">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center px-3 py-4 sm:p-6">
        <DialogPanel className="bg-white w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 border-b border-gray-100 text-center">
            <span className="inline-block bg-gradient-to-r from-[#c9a96a] to-[#fff4da] px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[#725527]">
              Secure Payment
            </span>
            <h3 className="mt-2 text-lg sm:text-xl font-bold text-gray-900">UPI Payment</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Pay to confirm your session
            </p>
          </div>

          {/* Body */}
          <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4">
            <div className="bg-[#faf7f1] border border-[#efe6d3] rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Counsellor:</span> {appointment?.counsellorName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Date & Time:</span> {appointment?.date} • {appointment?.timeSlot}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Session:</span> {appointment?.sessionType}
              </p>
              <p className="mt-2 text-base font-semibold text-[#c9a96a]">Amount: ₹{amount}</p>
            </div>

            <div>
              <Label className="text-[#725527] font-medium text-sm sm:text-base">Enter UPI ID</Label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@bank"
                className="mt-1"
              />
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              className="px-5 rounded-full"
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#c9a96a] text-white hover:bg-[#b3945a] px-6 rounded-full"
              onClick={pay}
              disabled={processing}
            >
              {processing ? 'Processing…' : 'Pay Now'}
            </Button>
          </div>

          {/* Inline processing overlay */}
          {processing && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-[#c9a96a] animate-spin" />
              <p className="mt-3 text-[#725527] text-sm font-medium">Confirming payment…</p>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
