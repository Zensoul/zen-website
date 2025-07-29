'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="relative bg-[#f8f5f0] pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background shape */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#f6f2ec] to-[#fdfaf5] opacity-80"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div data-aos="fade-up" className="text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c2c2c] leading-tight">
            Reclaim Your Life <br />
            with <span className="text-[#c9a96a]">Online Addiction Therapy</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
            Get confidential, expert counselling from the comfort of your home.
            Designed for individuals and families dealing with addiction and recovery.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button className="bg-[#c9a96a] hover:bg-[#b18c50] text-white px-6 py-3 text-sm font-semibold rounded-full shadow">
              Get Started
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-3 rounded-full text-sm"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Image Content */}
        <div data-aos="fade-left" className="relative">
          <img
            src="/illustrations/hero.png"
            alt="Online counselling illustration"
            width={600}
            height={600}
            className="w-full h-auto rounded-xl shadow-xl"
            
          />
        </div>
      </div>
    </section>
  )
}
