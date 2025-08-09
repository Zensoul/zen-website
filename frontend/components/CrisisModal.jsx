// File: components/CrisisModal.jsx
'use client'

import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'

export default function CrisisModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen bg-black/50">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-sm">
          <Dialog.Title className="text-lg font-semibold text-error mb-4">
            Crisis Resources
          </Dialog.Title>
          <p className="text-text mb-4">
            If you are thinking about harming yourself, please call <strong>988</strong> or chat with a counselor now.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => window.open('tel:988')}>
              Call 988
            </Button>
            <Button onClick={() => window.open('https://988lifeline.org/chat/')}>
              Chat Now
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
