import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { formatINR } from '../utils/formatters';

function CarIllustration() {
  return (
    <svg viewBox="0 0 180 80" className="h-20 w-44 drop-shadow-xl" fill="none">
      {/* Headlight beam */}
      <polygon points="168,46 180,38 180,58" fill="#FDE68A" opacity="0.65" />
      {/* Car body */}
      <path
        d="M18 46 L26 24 C29 17 36 14 45 14 H108 C118 14 126 19 133 28 L156 34 C165 36 170 42 170 50 V56 C170 60 167 62 162 62 H16 C12 62 10 59 10 55 V50 C10 47 13 46 18 46 Z"
        fill="#087CA7"
      />
      {/* Roof & windows */}
      <path d="M44 20 H76 V36 H33 L44 20 Z" fill="#E0F2FE" />
      <path d="M82 20 H106 C113 20 119 24 124 36 H82 V20 Z" fill="#BAE6FD" />
      {/* Sunrise stripe */}
      <rect x="20" y="45" width="138" height="4" rx="2" fill="#F59E0B" />
      {/* Taillight & Headlight */}
      <rect x="11" y="44" width="6" height="8" rx="2" fill="#EF4444" />
      <rect x="160" y="44" width="8" height="7" rx="2" fill="#FEF08A" />
      {/* Wheels */}
      <g>
        <circle cx="46" cy="62" r="13" fill="#102A43" />
        <circle cx="46" cy="62" r="6" fill="#CBD5E1" />
        <circle cx="136" cy="62" r="13" fill="#102A43" />
        <circle cx="136" cy="62" r="6" fill="#CBD5E1" />
      </g>
    </svg>
  );
}

function BikeIllustration() {
  return (
    <svg viewBox="0 0 160 85" className="h-20 w-40 drop-shadow-xl" fill="none">
      {/* Headlight beam */}
      <polygon points="132,34 158,24 158,48" fill="#FDE68A" opacity="0.65" />
      {/* Rear wheel */}
      <circle cx="36" cy="60" r="16" stroke="#102A43" strokeWidth="7" fill="#E2E8F0" />
      <circle cx="36" cy="60" r="5" fill="#073B5C" />
      {/* Front wheel */}
      <circle cx="122" cy="60" r="16" stroke="#102A43" strokeWidth="7" fill="#E2E8F0" />
      <circle cx="122" cy="60" r="5" fill="#073B5C" />
      {/* Frame & body */}
      <path
        d="M36 60 L64 42 H98 L122 60 M64 42 L56 32 H82 L106 34 L116 24"
        stroke="#087CA7"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fuel tank & seat */}
      <path d="M52 34 C58 28 74 28 84 32 L104 30 C110 30 113 36 106 40 H78 L52 38 Z" fill="#F59E0B" />
      {/* Rider helmet silhouette */}
      <circle cx="80" cy="14" r="9" fill="#073B5C" />
      <path d="M84 11 H90 V16 H84 Z" fill="#BAE6FD" />
      <path d="M74 23 L88 26 L104 28" stroke="#102A43" strokeWidth="5" strokeLinecap="round" />
      {/* Headlight */}
      <circle cx="122" cy="34" r="5" fill="#FEF08A" />
    </svg>
  );
}

function TruckIllustration() {
  return (
    <svg viewBox="0 0 210 90" className="h-22 w-52 drop-shadow-xl" fill="none">
      {/* Headlight beam */}
      <polygon points="196,52 210,44 210,64" fill="#FDE68A" opacity="0.65" />
      {/* Cargo container */}
      <rect x="10" y="14" width="122" height="48" rx="6" fill="#073B5C" />
      <rect x="18" y="22" width="106" height="8" rx="3" fill="#16A34A" />
      <rect x="18" y="36" width="84" height="5" rx="2.5" fill="#F59E0B" />
      {/* Truck cabin */}
      <path
        d="M136 26 H172 C180 26 186 30 190 38 L196 48 V62 H136 V26 Z"
        fill="#087CA7"
      />
      {/* Cabin window */}
      <path d="M144 32 H170 C175 32 179 35 182 42 H144 V32 Z" fill="#E0F2FE" />
      {/* Chassis */}
      <rect x="8" y="60" width="190" height="6" rx="3" fill="#1E293B" />
      {/* Headlight */}
      <rect x="190" y="48" width="6" height="8" rx="2" fill="#FEF08A" />
      {/* Wheels */}
      <circle cx="42" cy="70" r="13" fill="#102A43" />
      <circle cx="42" cy="70" r="5.5" fill="#CBD5E1" />
      <circle cx="102" cy="70" r="13" fill="#102A43" />
      <circle cx="102" cy="70" r="5.5" fill="#CBD5E1" />
      <circle cx="170" cy="70" r="13" fill="#102A43" />
      <circle cx="170" cy="70" r="5.5" fill="#CBD5E1" />
    </svg>
  );
}

export default function PaymentDriveAnimation({ vehicleType = 'Four Wheeler', amount }) {
  const isBike = vehicleType === 'Two Wheeler';
  const isTruck = vehicleType === 'Truck';
  const label = isBike ? 'Two Wheeler' : isTruck ? 'Truck' : 'Car';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#073B5C]/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-b from-sky-100 via-white to-emerald-100 p-6 shadow-2xl sm:p-8"
      >
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
            Processing Payment {amount ? `• ${formatINR(amount)}` : ''}
          </span>
          <h2 className="mt-3 font-heading text-xl font-extrabold text-[#073B5C] sm:text-2xl">
            Reserving Your {label} Parking Slot...
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Securing your bay &amp; generating your Kumari Parking QR boarding pass
          </p>
        </div>

        {/* Coastal Road Animation Track (Left -> Right) */}
        <div className="relative mt-7 h-36 w-full overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-200/70 via-sky-50 to-emerald-100/70">
          {/* Sunrise orb */}
          <div className="absolute right-10 top-3 h-10 w-10 rounded-full bg-gradient-to-br from-amber-300 to-[#F59E0B] opacity-80 blur-[1px]" />

          {/* Destination Parking Sign on the right */}
          <div className="absolute right-4 bottom-10 flex flex-col items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#073B5C] font-heading text-base font-extrabold text-white shadow-md ring-2 ring-[#F59E0B]">
              P
            </div>
            <div className="h-8 w-1 bg-slate-500" />
          </div>

          {/* Asphalt Road */}
          <div className="absolute inset-x-0 bottom-0 h-11 bg-[#1E293B]">
            <div className="flex h-full items-center justify-around px-4">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="h-1 w-8 rounded-full bg-amber-300/80" />
              ))}
            </div>
          </div>

          {/* Moving Vehicle: Left -> Right */}
          <motion.div
            initial={{ x: '-35%' }}
            animate={{ x: '115%' }}
            transition={{
              duration: 2.1,
              ease: [0.22, 1, 0.36, 1],
              repeat: Infinity,
              repeatDelay: 0.15,
            }}
            className="absolute bottom-5 left-0 flex items-center"
          >
            {/* Speed lines behind vehicle */}
            <div className="mr-1.5 flex flex-col gap-1.5 opacity-60">
              <div className="h-0.5 w-8 rounded-full bg-[#087CA7]" />
              <div className="h-0.5 w-12 rounded-full bg-[#16A34A]" />
              <div className="h-0.5 w-6 rounded-full bg-[#F59E0B]" />
            </div>

            {isBike ? (
              <BikeIllustration />
            ) : isTruck ? (
              <TruckIllustration />
            ) : (
              <CarIllustration />
            )}
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: '5%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.0, ease: 'easeInOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#073B5C] via-[#087CA7] to-[#16A34A]"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
