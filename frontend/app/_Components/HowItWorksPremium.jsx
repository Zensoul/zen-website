// app/_Components/HowItWorksPremium.jsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, ClipboardList } from 'lucide-react'
import AssessmentModal from '@/components/AssessmentModal'     
import BookingModal from '@/components/BookingModal'        // ✅ Import the modal
import { useUser } from '@/context/UserContext'


export default function HowItWorksPremium() {
  const { user } = useUser()
  const [showAssessment, setShowAssessment] = useState(false)  
  const [bookingCounsellor, setBookingCounsellor] = useState(null);       // ✅ Local state to control modal
  const track = (label, extra = {}) => {
  try {
    // GA4 (gtag)
    window.gtag?.('event', 'howitworks_click', {
      event_category: 'CTA',
      event_label: label,
      ...extra,
    })
    // GTM
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'howitworks_click', item: label, ...extra })
  } catch {}
}

  const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: 'easeOut', delay: i * 0.07 },
    viewport: { once: true },
  })

  return (
    <section
      id="how-it-works"
      aria-labelledby="howitworks-heading"
      className="relative isolate bg-[--background] px-4 sm:px-6 lg:px-8 py-14"
    >
      {/* subtle premium glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-luxe-glow" />

      {/* Heading + micro-blurb */}
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="howitworks-heading"
          className="font-serif text-[1.6rem] sm:text-[1.9rem] font-semibold tracking-tight text-[--foreground]"
        >
          How It Works: Start Your Recovery in 3 Simple Steps
        </h2>
        <div className="mx-auto mt-4 h-[2px] w-14 rounded bg-[--border]" />
        <p className="mt-3 text-sm sm:text-base text-[--foreground] opacity-90">
          Online addiction counseling begins with a free consultation, then we match you to the right therapist, and you
          start a personalized recovery plan—confidentially, from home.
        </p>
      </div>

      {/* Steps (ordered for accessibility & HowTo parity) */}
      <ol className="mx-auto mt-8 grid max-w-5xl gap-4 sm:gap-6">
        {/* Step 1 */}
        <motion.li {...fadeUp(0)} id="step-1" className="relative rounded-2xl border border-[#E5E7EB] bg-[#F5F6F7] p-5 sm:p-6 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-white shadow ring-1 ring-black/5">
              <CalendarDays className="h-5 w-5 text-gray-700" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-semibold">1</span>
                <h3 className="text-base sm:text-lg font-semibold text-[--foreground]">Book your free consultation</h3>
              </div>
              <p className="mt-2 text-sm text-[--foreground]/80">
                Choose a time that works for you, answer a few quick questions, and meet a counselor online to discuss goals and next steps.
              </p>
            </div>
          </div>
          <span className="sr-only">Step 1 of 3</span>
        </motion.li>

        {/* Step 2 */}
        <motion.li {...fadeUp(1)} id="step-2" className="relative rounded-2xl border border-[#E5E7EB] bg-[#F5F6F7] p-5 sm:p-6 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-white shadow ring-1 ring-black/5">
              <Users className="h-5 w-5 text-gray-700" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-semibold">2</span>
                <h3 className="text-base sm:text-lg font-semibold text-[--foreground]">Get matched with the right therapist</h3>
              </div>
              <p className="mt-2 text-sm text-[--foreground]/80">
                We pair you with a licensed counselor who specializes in your needs (alcohol, drugs, or behavioral addictions), availability, and language.
              </p>
            </div>
          </div>
          <span className="sr-only">Step 2 of 3</span>
        </motion.li>

        {/* Step 3 */}
        <motion.li {...fadeUp(2)} id="step-3" className="relative rounded-2xl border border-[#E5E7EB] bg-[#F5F6F7] p-5 sm:p-6 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-white shadow ring-1 ring-black/5">
              <ClipboardList className="h-5 w-5 text-gray-700" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-semibold">3</span>
                <h3 className="text-base sm:text-lg font-semibold text-[--foreground]">Start your personalized recovery plan</h3>
              </div>
              <p className="mt-2 text-sm text-[--foreground]/80">
                Begin structured sessions with practical tools for cravings, relapse prevention, and family support—tracked weekly for real progress.
              </p>
            </div>
          </div>
          <span className="sr-only">Step 3 of 3</span>
        </motion.li>
      </ol>

      {/* CTA row — centered, matches hero button styling */}
      <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-center">
        <Button
          asChild
          className="
            w-full sm:w-auto rounded-full
            bg-gray-700 hover:bg-gray-800
            px-6 py-2.5 text-sm sm:text-base font-semibold
            shadow-[0_8px_24px_rgba(17,24,39,0.2)]
            focus-visible:ring-2 focus-visible:ring-gray-700
            !text-white [&_*]:!text-white visited:!text-white
          "
          onClick={() => track('consultation', { item: 'consultation' })}
        >
          <Link href="/book-consultation" aria-label="Book a Free 15-Minute Consultation">
            Book a Free 15-Minute Consultation
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="
            w-full sm:w-auto rounded-full
            border-[--border] text-[--primary]
            px-6 py-2.5 text-sm sm:text-base font-semibold
            hover:bg-[--accent]
            focus-visible:ring-2 focus-visible:ring-[--primary]
          "
          onClick={() => track('self_test', { item: 'self_test' })}
        >
        <Link
             href="/addiction-self-test"
             aria-label="Take the Free Addiction Self-Test"
             onClick={(e) => {
             e.preventDefault();                 // stop Next.js navigation
             track('self_test', { item: 'self_test' })
             setShowAssessment(true)             // open the modal
              }}
              >
            Take the Free Addiction Self-Test
          </Link>
        </Button>
      </div>


      {/* JSON-LD: HowTo (merge once per page if needed) */}
      <Script id="schema-howto" type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to start online addiction counseling',
          description:
            'Begin with a free consultation, get matched to the right therapist, and start a personalized recovery plan.',
          totalTime: 'PT15M',
          supply: [],
          tool: [],
          step: [
            {
              '@type': 'HowToStep',
              name: 'Book your free consultation',
              url: 'https://www.zensoulwellness.com/#step-1',
              image: 'https://www.zensoulwellness.com/images/howitworks-step1.webp',
              text:
                'Choose a convenient time, answer brief intake questions, and meet a counselor online to discuss goals and next steps.',
            },
            {
              '@type': 'HowToStep',
              name: 'Get matched with the right therapist',
              url: 'https://www.zensoulwellness.com/#step-2',
              image: 'https://www.zensoulwellness.com/images/howitworks-step2.webp',
              text:
                'We pair you with a licensed counselor who fits your addiction type, preferences, availability, and language.',
            },
            {
              '@type': 'HowToStep',
              name: 'Start your personalized recovery plan',
              url: 'https://www.zensoulwellness.com/#step-3',
              image: 'https://www.zensoulwellness.com/images/howitworks-step3.webp',
              text:
                'Begin structured sessions focused on cravings, relapse prevention, and family support, with weekly progress tracking.',
            },
          ],
        })}
      </Script>
      {/* ✅ Always render the modal, controlled by showAssessment */}
      <AssessmentModal
        open={showAssessment}
        onClose={() => setShowAssessment(false)}
        onBookNow={(c) => {
          setShowAssessment(false) // CHANGE: close assessment (and its list) before opening booking
          setBookingCounsellor(c)   // CHANGE: open booking with chosen counsellor
        }}
      />
      
      <BookingModal
      open={!!bookingCounsellor}
      onClose={() => setBookingCounsellor(null)}
      counsellor={bookingCounsellor}
      user={user} />
    </section>
  )
}
