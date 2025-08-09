// File: components/QuestionCard.jsx
'use client'

import { motion } from 'framer-motion'

export default function QuestionCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-card p-6 mb-6"
    >
      {children}
    </motion.div>
  )
}
