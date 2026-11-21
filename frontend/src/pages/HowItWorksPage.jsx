import React from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  QrCode,
  ShieldCheck,
  LocateFixed,
  Smartphone,
  Mail,
  ArrowRight,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import ParkingAnimatedHeading from '../components/ParkingAnimatedHeading';

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: '100% Admin-Verified Lots',
    description: 'Every parking location is inspected and verified manually by our district admins.',
  },
  {
    icon: LocateFixed,
    title: 'Smart GPS Nearest Finder',
    description: 'Instant Haversine distance ranking with direct turn-by-turn Google Maps routes.',
  },
  {
    icon: IndianRupee,
    title: 'Transparent INR (₹) Pricing',
    description: 'Dynamic vehicle-based hourly rates calculated securely on our server.',
  },
  {
    icon: QrCode,
    title: 'Boarding-Pass QR Tickets',
    description: 'Downloadable PDF tickets with unique verification tokens and navigation links.',
  },
  {
    icon: Smartphone,
    title: 'Zero Double-Booking',
    description: 'Overlap-safe slot reservations with automatic expiry of unpaid temporary holds.',
  },
  {
    icon: Mail,
    title: 'Instant Email Confirmations',
    description: 'Automated receipts with your booking reference, slot number, and QR pass.',
  },
];

export default function HowItWorksPage() {
  return (
    <MainLayout>
      <section className="relative overflow-hidden py-14 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/kanyakumari-bg.jpg?v=2')" }}
          aria-hidden="true"
        />
        <div className="section-container relative z-10 text-center">
          <span className="rounded-full bg-[#073B5C]/90 px-3.5 py-1 text-xs font-semibold text-sky-100 border border-[#087CA7]/70">
            Smart District Parking
          </span>
          <div className="mt-3">
            <ParkingAnimatedHeading
              prefix="Why Choose"
              highlight="Kumari Parking"
              align="center"
              size="page"
            />
          </div>
          <p className="mx-auto mt-3 max-w-2xl rounded-xl bg-[#073B5C]/75 px-4 py-2 text-sm text-sky-100">
            Reserve your parking slot before reaching Kanyakumari Beach, Vivekananda Rock Ferry,
            Padmanabhapuram Palace, or Nagercoil Town.
          </p>
        </div>
      </section>

      <section className="section-container py-14">
        <div>
          <h2 className="text-center font-heading text-2xl font-bold text-[#073B5C] dark:text-white">
            Why Choose Kumari Parking?
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F59E0B] text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-bold text-[#073B5C] dark:text-white">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link to="/explore" className="btn-primary">
            Explore Parking Locations
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/nearest" className="btn-sunrise">
            Find Nearest Parking
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
