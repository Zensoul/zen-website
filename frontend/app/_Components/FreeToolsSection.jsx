// app/_Components/FreeToolsSection.jsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import QuickAddictionTestModal from '@/components/QuickAddictionTestModal'

export default function FreeToolsSection() {
  const [open, setOpen] = useState(false)

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-serif text-[#2c2c2c] mb-6">Free Tools & Resources</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-10">
          Take a free self-test or explore our recovery guides designed by clinical experts.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#c9a96a] hover:bg-[#b18c50] text-white rounded-full px-8 py-3"
          >
            Take the Free Addiction Self-Test
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-gray-300 text-gray-800 hover:bg-gray-50 px-8 py-3"
          >
            Browse Recovery Guides
          </Button>
        </div>
      </div>
      <QuickAddictionTestModal open={open} onClose={() => setOpen(false)} />
    </section>
  )
}
