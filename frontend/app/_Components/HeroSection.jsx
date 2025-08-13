'use client'

import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Fraunces } from 'next/font/google'


const fraunces = Fraunces({ subsets: ['latin'], weight: ['600','700'], display: 'swap' })

export default function HeroSection() {
  const track = (label) => {
    try {
      // GA4 (gtag)
      window.gtag?.('event', 'cta_click', {
        event_category: 'CTA',
        event_label: label,
      })
      // GTM
      window.dataLayer?.push({ event: 'cta_click', label })
    } catch {}
  }

  return (
    <section
      role="banner"
      className="
        relative isolate
        bg-[--background]
        min-h-[60vh]
        pt-10 sm:pt-12
        pb-10
      "
    >
      {/* Subtle premium gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-luxe-glow"
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8
+                 rounded-[1.25rem] lg:rounded-[1.5rem] ring-1 ring-[--border]/70
+                 bg-[--card]/60 backdrop-blur supports-[backdrop-filter]:bg-[--card]/50
+                 shadow-[0_30px_80px_rgba(0,0,0,0.06)]">
        {/* Grid: mobile-first stack, two-column on lg */}
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: copy */}
          <div className="lg:col-span-6">
            {/* H1 must be within first ~100px of viewport; minimal margin above */}
            <h1
  className={`${fraunces.className} text-[1.9rem] sm:text-[2.2rem] md:text-[2.45rem] leading-[1.12] tracking-tight text-[--foreground] text-center`}
  aria-label="Online Addiction Counseling – Confidential, Professional and Accessible"
>
  Online Addiction Counseling – Confidential, Professional & Accessible
</h1>

            {/* luxe underline after H1 */}
            <div className="mt-3 h-[2px] w-16 rounded bg-[--border]" />

            <h2
              className="
                mt-3 text-[1.05rem] sm:text-[1.15rem] md:text-[1.25rem]
                text-[--foreground]/90 max-w-2xl
              "
            >
              Over 10 years helping individuals overcome alcohol, drug, and behavioural addictions with
              evidence-based therapy and compassionate care.
            </h2>
            {/* Mobile image (shows only < lg) */}
        <div className="mt-5 lg:hidden">
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-[--border] bg-[--card] shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
            <img
              src="/illustrations/online-addiction-counseling-session.webp"
              alt="Therapist providing confidential online addiction counseling via video call"
              width={1400}
              height={1100}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            className="h-auto w-full object-cover"
            />
    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40" />
  </div>
    </div>


            {/* AI Overview definition (30–50 words) */}
            <p
              className="
                mt-4 text-sm sm:text-base text-[--foreground] max-w-2xl
              "
            >
              Online addiction counseling is a confidential, therapist-led recovery service that helps people
              address alcohol, drug, and behavioural addictions from home using evidence-based methods,
              structured goals, and compassionate support designed around your pace and privacy.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Button asChild
                className="
                  w-full sm:w-auto rounded-full
                bg-gray-700 hover:bg-gray-800
                  px-6 py-2.5 text-sm sm:text-base font-semibold
                  shadow-[0_8px_24px_rgba(17,24,39,0.2)]
      focus-visible:ring-2 focus-visible:ring-gray-700
      !text-white [&_*]:!text-white visited:!text-white
                "
                onClick={() => track('Free Consultation')}
              >
                <Link
                  href="/book-consultation"
                  aria-label="Book a Free 15 Minute Consultation for Addiction Counseling"
                  className="!text-white visited:!text-white"
                >
                  Book a Free 15-Minute Consultation
                </Link>
              </Button>

              <Button asChild
                variant="outline"
                className="
                  w-full sm:w-auto rounded-full
                  border-[--border] text-[--primary]
                  px-6 py-2.5 text-sm sm:text-base font-semibold
                  hover:bg-[--accent]
                  focus-visible:ring-2 focus-visible:ring-[--primary]
                  
                "
                onClick={() => track('Self-Test')}
              >
                <Link
                  href="/addiction-self-test"
                  aria-label="Take Our Free Addiction Self Test"
                >
                  Take Our Free Addiction Self-Test
                </Link>
              </Button>
            </div>

            {/* Small trust line */}
            <p className="mt-3 text-xs sm:text-sm text-[--foreground] opacity-80">
              HIPAA-grade privacy · Evidence-based care · India-wide availability
            </p>
          </div>

          {/* Right: visual (static image for trust) */}
          <div className="lg:col-span-6 hidden lg:block">
            <div
              className="
                relative overflow-hidden rounded-2xl sm:rounded-3xl
                ring-1 ring-[--border] bg-[--card]
                shadow-[0_20px_60px_rgba(0,0,0,0.06)]
                max-w-2xl lg:ml-auto
              "
            >
              <img
              src="/illustrations/online-addiction-counseling-session.webp"
              alt="Therapist providing confidential online addiction counseling via video call"
              width={1400}
              height={1100}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-auto w-full object-cover"
              />

              {/* Subtle frame accent */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/40" />
            </div>
          </div>
        </div>
      </div>

      {/* JSON-LD: WebPage + MedicalBusiness */}
      <Script id="schema-hero" type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              name: 'Online Addiction Counseling – Confidential, Professional & Accessible',
              description:
                'Over 10 years helping individuals overcome alcohol, drug, and behavioural addictions with evidence-based therapy and compassionate care.',
              url: 'https://www.zensoulwellness.com/',
              inLanguage: 'en',
            },
            {
              '@type': 'MedicalBusiness',
              name: 'ZenSoul Wellness',
              url: 'https://www.zensoulwellness.com/',
              areaServed: 'India',
              medicalSpecialty: 'Addiction',
              serviceType: 'Addiction Counseling',
              offers: {
                '@type': 'Offer',
                name: 'Free 15-Minute Consultation',
                url: 'https://www.zensoulwellness.com/book-consultation',
              },
            },
          ],
        })}
      </Script>
    </section>
  )
}
