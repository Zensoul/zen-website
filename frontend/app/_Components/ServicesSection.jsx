'use client'

import { motion } from 'framer-motion'
import Script from "next/script"   // ✅ add this
import Link from 'next/link'

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zensoulwellness.com'


const services = [
  {
    title: 'Alcohol Addiction Counseling',
    description: 'Evidence-based online alcohol counseling for craving control and relapse prevention with CBT/MI.',
    image: '/services/alcohol-addiction-counseling.webp',
    href: '/services/Alcohol Addiction Counseling',
  },
  {
    title: 'Drug De-Addiction Therapy',
    description: 'Specialized therapy for opioids, cannabis, and stimulants with trigger planning and coping skills.',
    image: '/services/drug-de-addiction-therapy.webp',
    href: '/services/Drug De-Addiction Therapy',
  },
  {
    title: 'Behavioral & Gambling Addiction',
    description: 'CBT and habit-reversal for gambling, gaming, and compulsive behaviors with boundary planning.',
    image: '/services/behavioral-gambling-addiction.webp',
    href: '/services/Drug De-Addiction Therapy',
  },
  {
    title: 'Rise After Relapse',
    description: 'Structured support and coping tools to overcome setbacks and build lasting recovery.',
    image: '/services/recovery.png',
    href: '/services/recovery-relapse',
  },
  {
    title: 'Calm the Storm Within',
    description: 'Personalized therapy to help you manage anxiety and find your inner peace.',
    image: '/services/anxiety.png',
    href: '/services/anxiety-counseling',
  },
  {
    title: 'Heal from the Inside Out',
    description: 'Rediscover joy and meaning with our holistic depression counseling approach.',
    image: '/services/depression.png',
    href: '/services/depression-counseling',
  },
  {
    title: 'Heal Together, Grow Together',
    description: 'Reconnect and restore harmony in your family through structured counseling.',
    image: '/services/family.png',
    href: '/services/family-counseling',
  },
  {
    title: 'Explore Your Inner Self',
    description: 'One-on-one therapy to guide your personal growth and emotional clarity.',
    image: '/services/individual.jpg',
    href: '/services/individual-counseling',
  },
]

export default function ServicesSection() {
  return (
    <section className="bg-[#f8f5f0] py-24 px-4 sm:px-6 lg:px-8 font-serif">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl text-[#2c2c2c] mb-4 tracking-tight leading-tight"
        >
          Begin Your Journey to Inner Healing
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-gray-600 text-lg max-w-2xl mx-auto mb-12 font-sans"
        >
          Choose a path of transformation with our deeply personalized counseling services, designed to empower and uplift you every step of the way.
        </motion.p>
      </div>

      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {services.map((service, index) => (
          <Link href={service.href} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease:'easeOut', delay: index * 0.15 }}
              viewport={{ once: true }}
              className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-2xl overflow-hidden shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer"
            >
              <div className="relative h-48 w-full">
                <div className="relative h-48 w-full overflow-hidden">
  <img
    src={service.image}
    alt={service.title}
    className="absolute inset-0 h-full w-full object-cover block"
    loading="lazy"
    decoding="async"
  />
</div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold text-[#2c2c2c] mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm font-sans">{service.description}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
{/* JSON-LD: ItemList of Service (uses the same data you render) */}
      <Script
        id="services-itemlist-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Online counseling and coaching services',
            itemListElement: services.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Service',
                name: s.title,
                url: new URL(s.href, SITE_ORIGIN).toString(),
                description: s.description,
                areaServed: 'Bangalore',
                provider: {
                  '@type': 'MedicalBusiness',
                  name: 'ZenSoul Wellness',
                },
              },
            })),
          }),
        }}
      />
    </section>
  )
}