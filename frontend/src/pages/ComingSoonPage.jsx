import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

export default function ComingSoonPage({ title, phaseLabel, description }) {
  return (
    <MainLayout>
      <section className="section-container flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#073B5C] to-[#087CA7] text-white shadow-lg">
          <Wrench className="h-8 w-8" />
        </div>
        <span className="mt-5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          {phaseLabel}
        </span>
        <h1 className="mt-3 font-heading text-3xl font-bold text-[#073B5C] dark:text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{description}</p>
        <Link to="/" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Kumari Parking Home
        </Link>
      </section>
    </MainLayout>
  );
}
