'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import AOS from 'aos'
import 'aos/dist/aos.css'

const features = [
  {
    icon: '/icons/messaging.png',
    title: 'Messaging + Live Sessions',
    description:
      'Flexibly connect with your therapist through secure messages and optional video or audio sessions.',
  },
  {
    icon: '/icons/therapist.png',
    title: 'Licensed, Empathetic Therapists',
    description:
      'All therapists are carefully vetted for licensure, cultural competence, and compassion.',
  },
  {
    icon: '/icons/tools.png',
    title: 'Integrated Self-Help Tools',
    description:
      'Access journals, therapy workbooks, and calming video guides between sessions.',
  },
  {
    icon: '/icons/therapy.png',
    title: 'Evidence-Based Therapies',
    description:
      'We offer CBT, Motivational Interviewing, and Relapse Prevention Strategies.',
  },
  {
    icon: '/icons/results.png',
    title: 'Real Results, Trusted Platform',
    description:
      '92% of clients reported progress after just 3 sessions with our platform.',
  },
]

const testimonials = [
  {
    name: 'Aarav, 29',
    quote: 'It felt like someone finally listened. I felt understood from the very first session.',
  },
  {
    name: 'Neha, 34',
    quote: 'My therapist truly understood addiction in an Indian family context. Life-changing.',
  },
  {
    name: 'Sameer, 41',
    quote: 'The tools between sessions kept me grounded during my recovery phase.',
  },
]

export default function WhyChooseUsSection() {
  useEffect(() => {
    AOS.init({ once: true })
  }, [])

  return (
    <section className="bg-[#f9f7f4] py-20 px-4 sm:px-8 lg:px-20" id="why-choose-us">
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h2 className="text-4xl font-serif text-[#2c2c2c] mb-4">
          Why Choose Zen Soul Wellness?
        </h2>
        <p className="text-lg text-gray-600">
          Designed with care, guided by science — your healing journey begins here.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
        {features.map((item, index) => (
          <div
            key={index}
            data-aos="fade-up"
            data-aos-delay={index * 100}
            className="bg-white/70 backdrop-blur-sm border border-gray-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out rounded-2xl px-6 py-8 max-w-xs mx-auto text-center"
          >
          <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#f1e8dc] to-[#e6d9c6] rounded-full flex items-center justify-center shadow-inner">
            <img src={item.icon} alt={item.title} className="w-full h-full object-contain rounded-full" />
          </div>
        </div>
        <h3 className="text-lg font-serif text-[#2c2c2c] mb-3">{item.title}</h3>
        <p className="text-sm text-gray-700">{item.description}</p>
    </div>
  ))}
</div>


      {/* Testimonials */}
      <div className="mt-20 max-w-5xl mx-auto text-center">
        <h3 className="text-2xl font-serif text-[#2c2c2c] mb-8">What Our Clients Say</h3>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, idx) => (
            <blockquote
              key={idx}
              data-aos="fade-up"
              data-aos-delay={idx * 100}
              className="bg-white/60 backdrop-blur-sm border border-gray-200 p-6 rounded-xl shadow-sm"
            >
              <p className="text-gray-700 italic mb-4">“{t.quote}”</p>
              <span className="text-sm font-medium text-gray-600">– {t.name}</span>
            </blockquote>
          ))}
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="mt-20 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-8 grid grid-cols-1 md:grid-cols-3 text-center gap-6 shadow-sm">
        <div data-aos="fade-up">
          <h4 className="text-2xl font-bold text-[#2c2c2c]">92%</h4>
          <p className="text-gray-600 text-sm">Clients experienced emotional clarity</p>
        </div>
        <div data-aos="fade-up" data-aos-delay="100">
          <h4 className="text-2xl font-bold text-[#2c2c2c]">20K+</h4>
          <p className="text-gray-600 text-sm">Sessions completed across India</p>
        </div>
        <div data-aos="fade-up" data-aos-delay="200">
          <h4 className="text-2xl font-bold text-[#2c2c2c]">4.9/5</h4>
          <p className="text-gray-600 text-sm">Average therapist rating</p>
        </div>
      </div>
    </section>
  )
}
