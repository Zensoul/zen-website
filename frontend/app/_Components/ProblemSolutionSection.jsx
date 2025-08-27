// app/_Components/ProblemSolutionSection.jsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import ConsultationModal from '@/components/ConsultationModal'
import QuickAddictionTestModal from '@/components/QuickAddictionTestModal'

const solutions = [
  {
    title: 'Confidential online therapy',
    desc: 'Private video sessions with licensed counselors, focused on craving control, relapse prevention, and coping skills.',
    href: '/online-addiction-counseling',
    problem: 'cravings',
  },
  {
    title: 'Custom recovery plans',
    desc: 'Personalized goals, weekly check-ins, and evidence-based tools tailored to substance, triggers, and schedule.',
    href: '/recovery-plans',
    problem: 'withdrawal',
  },
  {
    title: 'Support for families',
    desc: 'Guided sessions to reduce conflict, set boundaries, and rebuild trust—together.',
    href: '/family-therapy-addiction',
    problem: 'family_conflicts',
  },
]

export default function ProblemSolutionSection() {
  // modal state
  const [consultOpen, setConsultOpen] = useState(false)
  const [selfTestOpen, setSelfTestOpen] = useState(false)

  // GTM dataLayer helper
  const push = (evt, payload) => {
    try {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: evt, ...payload })
    } catch {}
  }

  // GA4/GTM tracker
  const track = (label) => {
    try {
      window.gtag?.('event', 'cta_click', { event_category: 'CTA', event_label: label })
      window.dataLayer?.push({ event: 'cta_click', label })
    } catch {}
  }

  return (
    <section
      aria-labelledby="ps-heading"
      className="relative isolate bg-[--background] px-4 sm:px-6 lg:px-8 py-14"
    >
      {/* Luxe glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-luxe-glow" />

      {/* Heading */}
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="ps-heading"
          className="font-serif text-[1.6rem] sm:text-[1.9rem] font-semibold tracking-tight text-[--foreground]"
        >
          Struggling with Addiction? You’re Not Alone.
        </h2>
        <div className="mx-auto mt-4 h-[2px] w-14 rounded bg-[--border]" />
        <p className="mt-3 text-sm sm:text-base text-[--foreground] opacity-90">
          Addiction is treatable. Our confidential online counseling provides structured recovery plans and family
          support so you’re not doing this alone.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-2">
        {/* Pain Points */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#F5F6F7] p-6 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-semibold text-[--foreground]">Pain Points</h3>
          <ul className="mt-4 space-y-4">
            <li>
              <p className="font-medium text-[--foreground]">Alcohol cravings & relapses</p>
              <p className="text-sm text-[--foreground]/80">
                Nights and stress cues trigger urges that keep recovery stalling.
              </p>
            </li>
            <li>
              <p className="font-medium text-[--foreground]">Drug withdrawal symptoms</p>
              <p className="text-sm text-[--foreground]/80">
                Sleep issues, anxiety, and low mood can make quitting feel impossible.
              </p>
            </li>
            <li>
              <p className="font-medium text-[--foreground]">Family conflicts due to addiction</p>
              <p className="text-sm text-[--foreground]/80">
                Arguments, mistrust, and burnout strain relationships at home.
              </p>
            </li>
          </ul>
        </div>

        {/* Solutions */}
        <div className="rounded-2xl border border-[#E4E6EA] bg-[#F2F3F5] p-6 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-semibold text-[--foreground]">Your Solutions</h3>
          <ul className="mt-4 space-y-5">
            {solutions.map((s) => (
              <li key={s.title}>
                <p className="font-medium text-[--foreground]">{s.title}</p>
                <p className="text-sm text-[--foreground]/80">{s.desc}</p>
                <Link
                  href={s.href}
                  aria-label={`${s.title} — learn more`}
                  className="mt-2 inline-block text-sm font-semibold text-[--primary] underline underline-offset-4 hover:text-[--primary-600]"
                  data-ps-problem={s.problem}
                  onClick={() =>
                    push('ps_link_click', {
                      item: 'internal_link',
                      href: s.href,
                      problem: s.problem,
                    })
                  }
                >
                  Learn more
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTAs - CENTERED */}
      <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button
          type="button"
          onClick={() => {
            track('free_consult')
            setConsultOpen(true)
          }}
          className="
            w-full sm:w-auto rounded-full
            bg-gray-700 hover:bg-gray-800
            px-6 py-2.5 text-sm sm:text-base font-semibold
            shadow-[0_8px_24px_rgba(17,24,39,0.2)]
            focus-visible:ring-2 focus-visible:ring-gray-700
            !text-white [&_*]:!text-white visited:!text-white
          "
          aria-label="Book a free 15-minute consultation"
        >
          Book Free 15-min Consultation
        </Button>

        <Button
          type="button"
          variant="outline"
          className="
            w-full sm:w-auto rounded-full
            border-[--border] text-[--primary]
            px-6 py-2.5 text-sm sm:text-base font-semibold
            hover:bg-[--accent]
            focus-visible:ring-2 focus-visible:ring-[--primary]
          "
          aria-label="Take the free addiction self test"
          onClick={() => {
            track('cta_self_test')
            setSelfTestOpen(true)
          }}
        >
          Take the Free Addiction Self-Test
        </Button>
      </div>

      {/* FAQ JSON-LD */}
      <Script id="ps-faq-schema" type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How can I control alcohol cravings and prevent relapse?',
              acceptedAnswer: {
                '@type': 'Answer',
                text:
                  'Confidential online therapy teaches craving-management, trigger planning, and relapse-prevention skills through weekly video sessions and a personalized recovery plan.',
              },
            },
            {
              '@type': 'Question',
              name: 'What helps with drug withdrawal symptoms at home?',
              acceptedAnswer: {
                '@type': 'Answer',
                text:
                  'A custom recovery plan with licensed counselors provides coping tools for sleep, anxiety, and mood, along with regular check-ins and referrals when medical care is needed.',
              },
            },
            {
              '@type': 'Question',
              name: 'How do we reduce family conflicts caused by addiction?',
              acceptedAnswer: {
                '@type': 'Answer',
                text:
                  'Family support sessions coach healthy boundaries, communication, and shared relapse-prevention strategies so the home environment supports recovery.',
              },
            },
          ],
        })}
      </Script>

      {/* MODALS */}
      <ConsultationModal open={consultOpen} onClose={() => setConsultOpen(false)} />
      <QuickAddictionTestModal open={selfTestOpen} onClose={() => setSelfTestOpen(false)} />
    </section>
  )
}
