import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is EduSphere?",
      a: "EduSphere is a cloud-native school management ERP built to streamline daily operations: admissions, attendance, fees, examinations, timetable, and campus public websites.",
    },
    {
      q: "Which educational institutions can use it?",
      a: "EduSphere is designed for private schools, secondary colleges, academies, and multi-campus school groups.",
    },
    {
      q: "How does school registration work?",
      a: "A school administrator selects a subscription plan, enters their school name, campus address, and admin credentials, and submits the registration request.",
    },
    {
      q: "Why does school approval require Super Admin review?",
      a: "To maintain platform trust and verify institutional credentials and payment documentation, the platform Super Admin approves incoming registrations before complete school portal features unlock.",
    },
    {
      q: "What happens after email verification?",
      a: "School administrators can access their onboarding workspace to configure school parameters and submit subscription proofs while awaiting approval.",
    },
    {
      q: "What plans are available?",
      a: "Plans include Free Trial, Professional, and Premium. Live capacities and pricing are fetched dynamically from the platform configuration.",
    },
    {
      q: "Can each school have its own website?",
      a: "Yes. Every approved school receives a dedicated public URL (/school/:slug) displaying campus details, academics, facilities, and direct portal logins.",
    },
    {
      q: "How can a school administrator access the platform?",
      a: "Administrators log in through the School Login gateway (/school-login) using their school's unique slug and authorized credentials.",
    },
    {
      q: "How can I contact the team?",
      a: "Prospective schools can submit enquiries through our dedicated school directories or contact our platform support team.",
    },
  ];

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Questions & Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-[#94A3B8]">
            Clear information about registration, approval, features, and platform access.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-[#0B1728]/70 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm text-white">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-[#49D6E8] transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs text-[#94A3B8] leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

