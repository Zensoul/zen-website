// File: app/_Components/Header.jsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import AuthModal from '@/components/AuthModal'
import { useUser } from '@/context/UserContext'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()

  const { user, loading, logoutUser: logout } = useUser()

  const navCenter = [
    { name: 'Home', href: '/' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
  ]

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* Left: Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="flex items-center gap-2">
            <img
              className="h-8 w-auto"
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
              alt="Logo"
            />
            <span className="font-serif font-bold text-xl text-gray-800">ZenSoul</span>
          </Link>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden lg:flex lg:gap-x-10">
          {navCenter.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-[#c9a96a] transition"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right: Auth / Avatar */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4 relative">
          {!loading && !user && (
            <>
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="text-sm font-medium text-gray-700 hover:text-[#c9a96a] transition"
              >
                Login
              </button>
              <Button
                onClick={() => router.push('/find-therapist')}
                className="rounded-full bg-[#c9a96a] hover:bg-[#b89256] text-white px-6 py-2 text-sm font-semibold shadow-md transition"
              >
                Find a Therapist
              </Button>
            </>
          )}

          {!loading && user && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 rounded-full border px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=c9a96a&color=fff`}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border z-50">
                  <div className="p-3 text-sm text-gray-700">Hi, {user.name}</div>
                  <hr className="border-gray-200" />

                  {/* Dashboard Link */}
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setDropdownOpen(false)
                      router.push('/')
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
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
            <Link href="/" className="flex items-center gap-2">
              <img
                className="h-8 w-auto"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                alt="Logo"
              />
              <span className="font-serif font-bold text-lg text-gray-800">ZenSoul</span>
            </Link>
            <button
              type="button"
              className="text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {navCenter.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block text-base font-medium text-gray-700 hover:text-[#c9a96a] transition"
              >
                {link.name}
              </Link>
            ))}

            {/* Dashboard Link for Mobile */}
            {user && (
              <Link
                href="/dashboard"
                className="block w-full text-left text-base font-medium text-gray-700 hover:text-[#c9a96a] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}

            {!user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setIsAuthOpen(true)
                }}
                className="block w-full text-left text-base font-medium text-gray-700 hover:text-[#c9a96a] transition"
              >
                Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                  router.push('/')
                }}
                className="block w-full text-left text-base font-medium text-gray-700 hover:text-[#c9a96a] transition"
              >
                Logout
              </button>
            )}

            <Button className="w-full mt-6 rounded-full bg-[#c9a96a] hover:bg-[#b89256] text-white font-semibold py-2 shadow-md transition">
              Find a Therapist
            </Button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
)
}
