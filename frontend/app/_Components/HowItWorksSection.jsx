// File: components/HowItWorksSection.jsx
'use client'

import { useState, useRef } from 'react'                             // ✅ Added useState, removed useRouter
import { motion } from 'framer-motion'
import { Lightbulb, Users, HeartPulse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AssessmentModal from '@/components/AssessmentModal'     
import BookingModal from '@/components/BookingModal'        // ✅ Import the modal
import { useUser } from '@/context/UserContext'

export default function HowItWorksSection() {
  const audioRef = useRef(null)
  const { user } = useUser()
  const [showAssessment, setShowAssessment] = useState(false)  
  const [bookingCounsellor, setBookingCounsellor] = useState(null);       // ✅ Local state to control modal

  // ✅ Added `onClick` and `clickable` flags; removed handleCardClick/router logic
  const steps = [
    {
      title: 'Share Your Story',
      description:
        'Answer a few guided questions about your goals, struggles, and preferences.',
      icon: <Lightbulb className="w-12 h-12 text-[#c9a96a]" />,
      onClick: () => setShowAssessment(true),                          // opens the modal
      clickable: true,                                                 // only this card is clickable
    },
    {
      title: 'Get Expert Matched',
      description:
        'We connect you with a licensed therapist who specializes in addiction recovery.',
      icon: <Users className="w-12 h-12 text-[#c9a96a]" />,
      clickable: false,                                                // not clickable
    },
    {
      title: 'Begin Your Healing',
      description:
        'Start therapy online through secure video, audio, or chat — on your terms.',
      icon: <HeartPulse className="w-12 h-12 text-[#c9a96a]" />,
      clickable: false,
    },
  ]

  const playChime = () => {
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

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
          Your path to recovery starts in just a few simple steps. Confidential.
          Personalized. Always here for you.
        </motion.p>
      </div>

      <div className="grid gap-10 sm:grid-cols-3 max-w-6xl mx-auto">
        {steps.map(({ title, description, icon, onClick, clickable }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 }}
            viewport={{ once: true }}
            onClick={clickable ? onClick : undefined}                   // ✅ Only clickable card has onClick
            className={`
              ${clickable ? 'cursor-pointer' : ''}                      // ✅ cursor-pointer only when clickable
              bg-white bg-opacity-90 backdrop-blur-sm border border-gray-200
              shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-xl p-6 text-center
              transition-all duration-300 transform hover:shadow-xl hover:-translate-y-1
              hover:scale-[1.02]
            `}
          >
            <div className="flex justify-center mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-[#333] mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
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
          onClick={playChime}
          className="bg-[#c9a96a] hover:bg-[#b18c50] text-white px-8 py-4 text-sm rounded-full shadow-md font-semibold transition duration-300"
        >
          Start Your Journey
        </Button>
        <audio ref={audioRef} src="/sounds/chime.mp3" preload="auto" />
      </motion.div>

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
