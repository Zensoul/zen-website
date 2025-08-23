// frontend/components/ConsultationModal.jsx
'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

function todayISO() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split('T')[0];
}

function addDaysISO(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function buildTimeSlots(start = '09:00', end = '20:45', stepMin = 15) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const slots = [];
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  for (let t = startMin; t <= endMin; t += stepMin) {
    const hh = String(Math.floor(t / 60)).padStart(2, '0');
    const mm = String(t % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

const DEFAULT_SLOTS = buildTimeSlots(); // 09:00 → 20:45 every 15 min

export default function ConsultationModal({ open, onClose }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(DEFAULT_SLOTS[4] || '10:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset when modal is closed
      setFullName('');
      setEmail('');
      setPhone('');
      setWhatsapp(true);
      setDate(todayISO());
      setTime(DEFAULT_SLOTS[4] || '10:00');
      setNotes('');
      setSubmitting(false);
      setError('');
      setSuccess(false);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);
    try {
      const payload = {
        name: fullName,
        email: email || undefined,
        phone: whatsapp
          ? phone?.startsWith('whatsapp:')
            ? phone
            : `whatsapp:${phone}`
          : phone,
        date,
        time,
        source: 'faq_consultation',
        topic: 'Free 15-min Consultation',
        notes: notes || undefined,
      };

      const res = await fetch(`${API_BASE}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to submit request');
      }

      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-3">
        <Dialog.Panel className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0B0F14]/90 text-white shadow-2xl ring-1 ring-white/10">
          <div className="relative p-5 sm:p-6">
            <div className="mb-4">
              <Dialog.Title className="text-lg sm:text-xl font-semibold">
                Free 15-min Consultation
              </Dialog.Title>
              <p className="text-sm text-slate-300">
                Pick a date & time (IST). We’ll confirm on WhatsApp/SMS.
              </p>
            </div>

            {success ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-200">
                <p className="font-medium mb-1">Request received!</p>
                <p className="text-sm">
                  Thanks {fullName || 'there'} — we’ve logged your consultation for {date} at {time} (IST).
                  You’ll get a confirmation shortly.
                </p>
                <div className="mt-4 flex gap-2">
                  <button onClick={onClose} className="btn-primary inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full name */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm text-slate-300">Full name</label>
                  <input
                    id="fullName"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none text-white"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>

                {/* Phone / WhatsApp */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm text-slate-300">
                    Phone <span className="text-slate-400">(WhatsApp preferred)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none text-white"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91XXXXXXXXXX"
                    required
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-300 mt-1 select-none">
                    <input
                      type="checkbox"
                      checked={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.checked)}
                      className="accent-white"
                    />
                    Notify me on WhatsApp
                  </label>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-slate-300">
                    Email <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm text-slate-300">Date (IST)</label>
                    <input
                      id="date"
                      type="date"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none text-white"
                      value={date}
                      min={todayISO()}
                      max={addDaysISO(todayISO(), 30)}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="time" className="text-sm text-slate-300">Time (15-min slots)</label>
                    <select
                      id="time"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none text-white"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    >
                      {DEFAULT_SLOTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm text-slate-300">
                    Anything we should know? <span className="text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none text-white"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., brief concern or preference"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost w-28 inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium bg-white/5 text-white hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium bg-[#8A7BFF] text-white hover:opacity-90 disabled:opacity-70"
                  >
                    {submitting ? 'Submitting…' : 'Request Consultation'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  All times are in IST (UTC+5:30). This is a free 15-minute discovery call.
                </p>
              </form>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
