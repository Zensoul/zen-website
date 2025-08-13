// File: app/page.js

import HeroSection from '@/app/_Components/HeroSection'
import ServicesSection from '@/app/_Components/ServicesSection'
import HowItWorksSection from '@/app/_Components/HowItWorksSection'
import WhyChooseUsSection from '@/app/_Components/WhyChooseUsSection'
import ProblemSolutionSection from './_Components/ProblemSolutionSection'
import HowItWorksPremium from './_Components/HowItWorksPremium'
import FAQs from './_Components/FAQs'



export default function Home() {
  return (
    <>
      <HeroSection />
      <ProblemSolutionSection />
      <HowItWorksPremium />
      <ServicesSection />
      <FAQs />
      <WhyChooseUsSection />
      <HowItWorksSection />
      
    </>
  )
}
