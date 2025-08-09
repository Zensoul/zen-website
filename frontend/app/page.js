// File: app/page.js

import HeroSection from '@/app/_Components/HeroSection'
import ServicesSection from '@/app/_Components/ServicesSection'
import HowItWorksSection from '@/app/_Components/HowItWorksSection'
import WhyChooseUsSection from '@/app/_Components/WhyChooseUsSection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      <WhyChooseUsSection />
    </>
  )
}
