'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const services = [
  {
    title: 'Break Free from Addiction',
    description: 'Guided healing to help you reclaim control over substance or behavioral addictions.',
    image: '/services/addiction.png',
    href: '/services/addiction-counseling',
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
                <img
                  src={service.image}
                  alt={service.title}
                  className="object-cover rounded-t-2xl"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold text-[#2c2c2c] mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm font-sans">{service.description}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  )
}
