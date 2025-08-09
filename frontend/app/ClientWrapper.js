// app/ClientWrapper.jsx
'use client'

import { useEffect } from 'react'
import { Jost } from 'next/font/google'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { UserProvider } from '@/context/UserContext'
import './globals.css'
import Header from './_Components/Header'

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: [
    '100','200','300','400','500','600','700','800','900'
  ],
})

export default function ClientWrapper({ children }) {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    })
  }, [])

  return (
    <UserProvider>
      <div className={jost.className}>
        <Header />
        {children}
      </div>
    </UserProvider>
  )
}
