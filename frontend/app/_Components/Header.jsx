'use client'

import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navCenter = [
    { name: 'Home', href: '#' },
    { name: 'How It Works', href: '#' },
    { name: 'Services', href: '#' },
    { name: 'Contact', href: '#' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8"
        aria-label="Global"
      >
        {/* Left: Logo */}
        <div className="flex lg:flex-1">
          <a href="#" className="flex items-center gap-2">
            <img
              className="h-8 w-auto"
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
              alt="Logo"
            />
            <span className="font-serif font-bold text-xl text-gray-800">ZenSoul</span>
          </a>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden lg:flex lg:gap-x-10">
          {navCenter.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-[#c9a96a] transition"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right: Login + CTA */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
          <a
            href="#"
            className="text-sm font-medium text-gray-700 hover:text-[#c9a96a] transition"
          >
            Login
          </a>
          <Button className="rounded-full bg-[#c9a96a] hover:bg-[#b89256] text-white px-6 py-2 text-sm font-semibold shadow-md transition">
            Find a Therapist
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-40 bg-black/30" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-3/4 max-w-sm bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <a href="#" className="flex items-center gap-2">
              <img
                className="h-8 w-auto"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                alt="Logo"
              />
              <span className="font-serif font-bold text-lg text-gray-800">ZenSoul</span>
            </a>
            <button
              type="button"
              className="text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {[...navCenter, { name: 'Login', href: '#' }].map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-base font-medium text-gray-700 hover:text-[#c9a96a] transition"
              >
                {link.name}
              </a>
            ))}
            <Button className="w-full mt-6 rounded-full bg-[#c9a96a] hover:bg-[#b89256] text-white font-semibold py-2 shadow-md transition">
              Find a Therapist
            </Button>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}
