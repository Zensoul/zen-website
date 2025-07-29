"use client";

import { useEffect } from "react";
import { Jost } from "next/font/google";
import AOS from "aos";
import "aos/dist/aos.css";

import "./globals.css";
import Header from "./_Components/Header";
import HeroSection from "./_Components/HeroSection";
import HowItWorksSection from "./_Components/HowItWorksSection";
import ServicesSection from "./_Components/ServicesSection";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function ClientWrapper({ children }) {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <div className={jost.className}>
      <Header />
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      {children}
    </div>
  );
}
