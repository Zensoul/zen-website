// File: app/page.js

import HeroSection from '@/app/_Components/HeroSection'
import ServicesSection from '@/app/_Components/ServicesSection'
import ConfidentialitySection from '@/app/_Components/ConfidentialitySection'
import WhyChooseUsSection from '@/app/_Components/WhyChooseUsSection'
import ProblemSolutionSection from './_Components/ProblemSolutionSection'
import HowItWorksPremium from './_Components/HowItWorksPremium'
import FAQs from './_Components/FAQs'
import FreeToolsSection from './_Components/FreeToolsSection'
import TherapistsSection from './_Components/TherapistsSection'
import PricingSection from './_Components/PricingSection'
import BlogSection from './_Components/BlogSection'
import Footer from './_Components/Footer'



export default function Home() {
  return (
    <>
      <HeroSection />
      <ProblemSolutionSection />
      <HowItWorksPremium />
      <ServicesSection />
      <FAQs />
      <WhyChooseUsSection />
      <TherapistsSection />
      <FreeToolsSection />
      <PricingSection />
      <BlogSection />
      <ConfidentialitySection />
      <Footer />
      
    </>
  )
}
