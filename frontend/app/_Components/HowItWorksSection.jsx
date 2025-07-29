'use client'

import { Button } from '@/components/ui/button'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Users, HeartPulse } from 'lucide-react'

export default function HowItWorksSection() {
  const audioRef = useRef(null)

  const handleClick = () => {
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  const steps = [
    {
      title: 'Share Your Story',
      description: 'Answer a few guided questions about your goals, struggles, and preferences.',
      icon: <Lightbulb className="w-12 h-12 text-[#c9a96a]" />,
    },
    {
      title: 'Get Expert Matched',
      description: 'We connect you with a licensed therapist who specializes in addiction recovery.',
      icon: <Users className="w-12 h-12 text-[#c9a96a]" />,
    },
    {
      title: 'Begin Your Healing',
      description: 'Start therapy online through secure video, audio, or chat — on your terms.',
      icon: <HeartPulse className="w-12 h-12 text-[#c9a96a]" />,
    },
  ]

  return (
    <section className="bg-[#fdfaf5] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-serif text-[#2c2c2c] mb-4"
        >
          How It Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-gray-600 text-lg max-w-2xl mx-auto mb-12"
        >
          Your path to recovery starts in just a few simple steps. Confidential. Personalized. Always here for you.
        </motion.p>
      </div>

      <div className="grid gap-10 sm:grid-cols-3 max-w-6xl mx-auto">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + index * 0.15 }}
            viewport={{ once: true }}
            className="bg-white bg-opacity-90 backdrop-blur-sm border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-xl p-6 text-center transition-all duration-300 transform hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]"
          >
            <div className="flex justify-center mb-4">{step.icon}</div>
            <h3 className="text-xl font-semibold text-[#333] mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        viewport={{ once: true }}
        className="mt-16 text-center"
      >
        <Button
          onClick={handleClick}
          className="bg-[#c9a96a] hover:bg-[#b18c50] text-white px-8 py-4 text-sm rounded-full shadow-md font-semibold transition duration-300"
        >
          Start Your Journey
        </Button>
        <audio ref={audioRef} src="/sounds/chime.mp3" preload="auto" />
      </motion.div>
    </section>
  )
}
