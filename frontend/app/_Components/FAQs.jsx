// app/_components/FAQs.jsx
"use client"

import Link from "next/link"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import Script from "next/script"   // ✅ add this

export default function FAQs() {
  return (
    <section aria-labelledby="faqs-heading" className="relative mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* Luxe background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#101012] via-[#141416] to-[#0f0f10]" />
      <div className="absolute inset-x-0 -top-10 -z-10 h-24 bg-white/10 blur-2xl" />

      <header className="text-center">
        <h2 id="faqs-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-base sm:text-lg text-white/70">
          Direct, confidential answers to help you make an informed start.
        </p>
      </header>

      <Accordion type="single" collapsible className="mt-6 divide-y divide-white/10 rounded-2xl bg-white/[0.035] backdrop-blur-sm shadow-[0_8px_40px_rgb(0,0,0,0.35)]">
        {/* Q1 */}
        <AccordionItem value="q1" className="border-none">
          <AccordionTrigger
            className="px-4 py-4 text-left text-white hover:no-underline"
            onClick={() => pushFAQEvent("What is online addiction counseling?")}
          >
            What is online addiction counseling?
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 text-white/80">
            <p className="mb-2">
              <strong>Short answer:</strong> Confidential, therapist-led support via secure video to manage cravings, prevent relapse, and rebuild routines.
            </p>
            <p>
              Sessions use evidence-based methods (CBT, MI) and a personalized recovery plan.{" "}
              <Link href="/online-addiction-counseling" className="underline underline-offset-4">Learn more</Link>.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Q2 */}
        <AccordionItem value="q2" className="border-none">
          <AccordionTrigger
            className="px-4 py-4 text-left text-white hover:no-underline"
            onClick={() => pushFAQEvent("Can I recover without going to rehab?")}
          >
            Can I recover without going to rehab?
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 text-white/80">
            <p className="mb-2">
              <strong>Short answer:</strong> Yes—many recover with structured outpatient counseling if medically stable and supported.
            </p>
            <p>
              If withdrawal risks or safety concerns exist, start with medical detox/inpatient care, then continue online.{" "}
              <Link href="/recovery-plans" className="underline underline-offset-4">See recovery options</Link>.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Q3 */}
        <AccordionItem value="q3" className="border-none">
          <AccordionTrigger
            className="px-4 py-4 text-left text-white hover:no-underline"
            onClick={() => pushFAQEvent("Is online counseling confidential?")}
          >
            Is online counseling confidential?
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 text-white/80">
            <p className="mb-2">
              <strong>Short answer:</strong> Yes—encrypted sessions, strict access controls, and no recording without written consent.
            </p>
            <p>
              Your data is stored securely; you can request deletion/export anytime.{" "}
              <Link href="/privacy-policy" className="underline underline-offset-4">Privacy &amp; consent</Link>.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Q4 */}
        <AccordionItem value="q4" className="border-none">
          <AccordionTrigger
            className="px-4 py-4 text-left text-white hover:no-underline"
            onClick={() => pushFAQEvent("How long does addiction recovery take?")}
          >
            How long does addiction recovery take?
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 text-white/80">
            <p className="mb-2">
              <strong>Short answer:</strong> Many see progress in <strong>4–6 sessions</strong>; structured plans often run <strong>8–12+ weeks</strong>.
            </p>
            <p>
              Timing depends on substance, severity, and co-occurring conditions.{" "}
              <Link href="/recovery-plans" className="underline underline-offset-4">Build your plan</Link>.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="mt-4 text-xs text-white/60">
        We don’t handle emergencies. If you’re in danger or experiencing severe withdrawal, seek urgent medical care immediately.
      </p>

      {/* CTA Row */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/book-consultation"
          className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black shadow hover:opacity-90"
          aria-label="Book a free 15 minute consultation"
          onClick={() => pushFAQEvent("cta_consultation")}
        >
          Book a Free 15-Minute Consultation
        </Link>
        <Link
          href="/addiction-self-test"
          className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
          aria-label="Take the free addiction self test"
          onClick={() => pushFAQEvent("cta_self_test")}
        >
          Take the Free Addiction Self-Test
        </Link>
      </div>

      {/* JSON-LD inline for convenience (optional if already added globally) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context":"https://schema.org",
            "@type":"FAQPage",
            "mainEntity":[
              {"@type":"Question","name":"What is online addiction counseling?","acceptedAnswer":{"@type":"Answer","text":"Online addiction counseling is confidential, therapist-led support via secure video to manage cravings, prevent relapse, and rebuild routines with evidence-based methods (CBT, MI)."}},
              {"@type":"Question","name":"Can I recover without going to rehab?","acceptedAnswer":{"@type":"Answer","text":"Yes—many recover with structured outpatient counseling if medically stable and supported. If withdrawal risks or safety concerns exist, medical detox/inpatient care is recommended before online therapy."}},
              {"@type":"Question","name":"Is online counseling confidential?","acceptedAnswer":{"@type":"Answer","text":"Yes—sessions are encrypted with strict access controls and not recorded without written consent. Data is stored securely; deletion/export is available on request."}},
              {"@type":"Question","name":"How long does addiction recovery take?","acceptedAnswer":{"@type":"Answer","text":"Timelines vary; many see progress in 4–6 sessions, with structured plans typically 8–12+ weeks and ongoing support as needed."}}
            ]
          })
        }}
      />
    </section>
  )
}

function pushFAQEvent(question) {
  // GA4 via GTM
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event: "faq_interaction", question })
}
