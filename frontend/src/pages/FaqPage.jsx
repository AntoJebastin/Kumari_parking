import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import ParkingAnimatedHeading from '../components/ParkingAnimatedHeading';
import { FAQ_ITEMS } from '../data/demoPreviewData';

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <MainLayout>
      <section className="relative overflow-hidden py-14 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/kanyakumari-bg.jpg?v=2')" }}
          aria-hidden="true"
        />
        <div className="section-container relative z-10 text-center [text-shadow:0_2px_10px_rgba(0,0,0,0.65)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-amber-200 backdrop-blur-sm">
            <HelpCircle className="h-3.5 w-3.5 text-[#F59E0B]" />
            Help Center
          </span>
          <div className="mt-3">
            <ParkingAnimatedHeading
              prefix="Frequently Asked"
              highlight="Questions"
              align="center"
              size="page"
            />
          </div>
          <p className="mx-auto mt-2 max-w-xl text-sm text-sky-100/90">
            Everything you need to know about verified slots, INR (₹) payments, QR tickets, and
            GPS navigation across Kanyakumari District.
          </p>
        </div>
      </section>

      <section className="section-container max-w-4xl py-14">
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                >
                  <span className="font-heading text-sm font-semibold text-[#102A43] dark:text-white sm:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#087CA7] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t border-slate-100 px-6 py-4 text-sm leading-relaxed text-slate-600 dark:border-sky-900/50 dark:text-slate-300">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
          <h2 className="font-heading text-lg font-bold text-[#073B5C] dark:text-white">
            Still have questions?
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Our Kanyakumari District support team in Villukuri is available 24/7.
          </p>
          <Link to="/contact" className="btn-primary mt-4">
            <MessageCircle className="h-4 w-4" />
            Contact District Support
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
