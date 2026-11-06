import React, { useState } from "react";
import SchoolSearchModal from "@/component/SchoolSearchModal";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { FeatureStorySection } from "@/components/landing/FeatureStorySection";
import { SchoolWebsiteShowcase } from "@/components/landing/SchoolWebsiteShowcase";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { RolesSection } from "@/components/landing/RolesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] font-sans antialiased overflow-x-hidden selection:bg-[#49D6E8] selection:text-[#07111F]">
      {/* 1. Header & Navigation */}
      <Navbar onSearch={() => setSearchOpen(true)} />

      {/* 2. Hero Section with Real UI Demonstration */}
      <HeroSection />

      {/* 3. Trust & Architecture Strip */}
      <TrustStrip />

      {/* 4. Operational Problems Solved */}
      <ProblemSection />

      {/* 5. Signature Interactive Product Showcase */}
      <ProductShowcase />

      {/* 6. Feature Storytelling (Student, Operations, Fees, Academics) */}
      <FeatureStorySection />

      {/* 7. Multi-School Public Website Feature */}
      <SchoolWebsiteShowcase />

      {/* 8. Four-Step Operational Lifecycle Workflow */}
      <WorkflowSection />

      {/* 9. Designed for School Roles */}
      <RolesSection />

      {/* 10. Dynamic Real API Pricing Section */}
      <PricingSection />

      {/* 11. Security & Data Protection */}
      <SecuritySection />

      {/* 12. FAQ Accordion */}
      <FAQSection />

      {/* 13. Final Conversion CTA */}
      <FinalCTA />

      {/* 14. Professional Enterprise Footer */}
      <Footer />

      {/* Real School Search Modal */}
      <SchoolSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
