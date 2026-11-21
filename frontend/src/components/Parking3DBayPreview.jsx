import React from 'react';
import { motion } from 'framer-motion';

function MiniCar3D() {
  return (
    <svg viewBox="0 0 120 62" className="h-14 w-28 drop-shadow-[0_10px_6px_rgba(0,0,0,0.45)]" fill="none">
      {/* 3D shadow */}
      <ellipse cx="60" cy="54" rx="46" ry="6" fill="rgba(0,0,0,0.35)" />
      {/* Lower body */}
      <path d="M14 36 L22 20 C25 14 31 12 39 12 H78 C86 12 92 16 97 23 L110 28 C115 30 116 34 116 40 V44 C116 47 113 48 109 48 H14 C10 48 9 45 9 42 V39 C9 37 11 36 14 36 Z" fill="#0284C7" />
      {/* 3D roof highlight */}
      <path d="M36 16 H75 C81 16 86 19 90 27 H28 L36 16 Z" fill="#BAE6FD" />
      <rect x="57" y="16" width="4" height="11" fill="#073B5C" />
      {/* Accent stripe */}
      <rect x="16" y="36" width="94" height="3.5" rx="1.5" fill="#F59E0B" />
      {/* Lights */}
      <rect x="108" y="34" width="6" height="5" rx="1.5" fill="#FEF08A" />
      <rect x="10" y="35" width="5" height="5" rx="1.5" fill="#EF4444" />
      {/* Wheels */}
      <circle cx="33" cy="48" r="9" fill="#0F172A" />
      <circle cx="33" cy="48" r="4" fill="#CBD5E1" />
      <circle cx="91" cy="48" r="9" fill="#0F172A" />
      <circle cx="91" cy="48" r="4" fill="#CBD5E1" />
    </svg>
  );
}

function MiniBike3D() {
  return (
    <svg viewBox="0 0 110 64" className="h-14 w-24 drop-shadow-[0_10px_6px_rgba(0,0,0,0.45)]" fill="none">
      <ellipse cx="55" cy="55" rx="38" ry="5.5" fill="rgba(0,0,0,0.35)" />
      <circle cx="27" cy="46" r="11" stroke="#0F172A" strokeWidth="5" fill="#E2E8F0" />
      <circle cx="85" cy="46" r="11" stroke="#0F172A" strokeWidth="5" fill="#E2E8F0" />
      <path d="M27 46 L48 32 H70 L85 46 M48 32 L42 24 H64 L76 26 L83 18" stroke="#0284C7" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 26 C46 21 58 21 66 25 L76 24 C80 24 81 29 76 31 H58 L40 29 Z" fill="#F59E0B" />
      <circle cx="58" cy="12" r="6.5" fill="#073B5C" />
      <circle cx="86" cy="26" r="3.5" fill="#FEF08A" />
    </svg>
  );
}

function MiniTruck3D() {
  return (
    <svg viewBox="0 0 140 66" className="h-14 w-32 drop-shadow-[0_10px_6px_rgba(0,0,0,0.45)]" fill="none">
      <ellipse cx="70" cy="58" rx="58" ry="6" fill="rgba(0,0,0,0.35)" />
      {/* 3D Cargo box */}
      <rect x="8" y="10" width="80" height="36" rx="4" fill="#073B5C" />
      <rect x="14" y="16" width="68" height="6" rx="2" fill="#16A34A" />
      <rect x="14" y="27" width="54" height="4" rx="2" fill="#F59E0B" />
      {/* Cabin */}
      <path d="M91 18 H115 C121 18 125 21 128 27 L132 35 V46 H91 V18 Z" fill="#0284C7" />
      <path d="M96 22 H114 C118 22 121 25 123 30 H96 V22 Z" fill="#BAE6FD" />
      <rect x="126" y="35" width="5" height="6" rx="1.5" fill="#FEF08A" />
      {/* Wheels */}
      <circle cx="28" cy="50" r="9.5" fill="#0F172A" />
      <circle cx="28" cy="50" r="4" fill="#CBD5E1" />
      <circle cx="68" cy="50" r="9.5" fill="#0F172A" />
      <circle cx="68" cy="50" r="4" fill="#CBD5E1" />
      <circle cx="114" cy="50" r="9.5" fill="#0F172A" />
      <circle cx="114" cy="50" r="4" fill="#CBD5E1" />
    </svg>
  );
}

/**
 * Compact 3D Isometric Parking Bay Animation for BookingPage.
 * Re-animates smoothly whenever the user changes Vehicle Type or Parking Slot.
 */
export default function Parking3DBayPreview({ vehicleType = 'Four Wheeler', slotNumber = 'A-01' }) {
  const isBike = vehicleType === 'Two Wheeler';
  const isTruck = vehicleType === 'Truck';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-r from-[#073B5C] via-[#0B5577] to-[#0E6B5D] p-4 text-white shadow-inner">
      <div className="flex items-center justify-end text-xs">
        <span className="rounded-full bg-emerald-500/25 border border-emerald-300/50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-200">
          BAY {slotNumber || 'SELECT'}
        </span>
      </div>

      {/* 3D Isometric Stage */}
      <div
        className="relative mt-2 flex h-32 w-full items-center justify-center overflow-hidden"
        style={{ perspective: '750px' }}
      >
        {/* Tilted 3D Parking Deck */}
        <div
          className="relative h-28 w-[92%] max-w-md rounded-xl border-2 border-emerald-300/60 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 shadow-2xl"
          style={{
            transform: 'rotateX(48deg) rotateZ(-6deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Approach lane arrows */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-60">
            <span className="h-1.5 w-6 rounded-full bg-amber-300" />
            <span className="h-1.5 w-6 rounded-full bg-amber-300" />
            <span className="h-1.5 w-6 rounded-full bg-amber-300" />
          </div>

          {/* Highlighted 3D Parking Bay Box on the right */}
          <div className="absolute right-4 top-2.5 bottom-2.5 w-44 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-500/15 flex items-center justify-end pr-3">
            <span className="font-parking-display text-xs font-extrabold text-emerald-300/80">
              {slotNumber || 'P'}
            </span>
          </div>
        </div>

        {/* Animated 3D Entry Barrier Gate */}
        <motion.div
          key={`gate-${vehicleType}-${slotNumber}`}
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -68, -68, 0] }}
          transition={{ duration: 2.8, times: [0, 0.2, 0.8, 1], ease: 'easeInOut' }}
          className="absolute left-[22%] bottom-10 h-1.5 w-14 origin-left rounded-full bg-gradient-to-r from-red-500 via-white to-red-500 shadow-md"
        />

        {/* Animated 3D Vehicle Driving Into the Parking Bay */}
        <motion.div
          key={`veh-${vehicleType}-${slotNumber}`}
          initial={{ x: -165, y: 12, scale: 0.85, opacity: 0 }}
          animate={{ x: 52, y: -2, scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-7"
        >
          {isBike ? <MiniBike3D /> : isTruck ? <MiniTruck3D /> : <MiniCar3D />}
        </motion.div>

        {/* Floating Glowing Status Dot */}
        <motion.div
          key={`glow-${vehicleType}-${slotNumber}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0.8], scale: [0.6, 1.1, 1] }}
          transition={{ delay: 1.35, duration: 0.45 }}
          className="absolute right-6 top-3 rounded-full bg-[#16A34A] px-2 py-0.5 text-[10px] font-bold text-white shadow-md"
        >
          PARKED ✓
        </motion.div>
      </div>
    </div>
  );
}
