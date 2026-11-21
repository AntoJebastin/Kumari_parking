import React from 'react';

/**
 * Kanyakumari Coastal Silhouette Backdrop:
 * Depicts the iconic Triveni Sangam sunrise over the Indian Ocean,
 * Vivekananda Rock Memorial dome, and Thiruvalluvar Statue.
 */
export default function KanyakumariHeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Sunrise Glow Orb */}
      <div className="absolute -top-24 right-8 h-96 w-96 rounded-full bg-[#F59E0B]/30 blur-3xl sm:right-24" />
      <div className="absolute top-12 right-16 h-44 w-44 rounded-full bg-amber-300/35 blur-2xl sm:right-40" />

      {/* Coastal Horizon SVG */}
      <svg
        viewBox="0 0 1440 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-44 w-full sm:h-56 md:h-64"
      >
        <defs>
          <linearGradient id="kkSunGrad" x1="1120" y1="20" x2="1120" y2="210" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" stopOpacity="0.95" />
            <stop offset="0.6" stopColor="#F59E0B" stopOpacity="0.65" />
            <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="kkWave1" x1="0" y1="220" x2="1440" y2="220" gradientUnits="userSpaceOnUse">
            <stop stopColor="#073B5C" stopOpacity="0.72" />
            <stop offset="0.5" stopColor="#087CA7" stopOpacity="0.6" />
            <stop offset="1" stopColor="#073B5C" stopOpacity="0.78" />
          </linearGradient>
        </defs>

        {/* Rising Sun */}
        <circle cx="1115" cy="145" r="78" fill="url(#kkSunGrad)" />

        {/* Vivekananda Rock Memorial Silhouette (Left-Center Island) */}
        <g opacity="0.52" fill="#062A42">
          {/* Rock base */}
          <path d="M840 245 Q880 212 945 215 Q1000 218 1030 245 Z" />
          {/* Mandapam Pavilion & Dome */}
          <rect x="895" y="192" width="84" height="26" rx="2" />
          <path d="M908 192 Q937 162 966 192 Z" />
          <rect x="935" y="156" width="4" height="14" />
          <circle cx="937" cy="155" r="3" />
          {/* Columns detail */}
          <rect x="905" y="196" width="5" height="18" fill="#087CA7" opacity="0.5" />
          <rect x="920" y="196" width="5" height="18" fill="#087CA7" opacity="0.5" />
          <rect x="949" y="196" width="5" height="18" fill="#087CA7" opacity="0.5" />
          <rect x="964" y="196" width="5" height="18" fill="#087CA7" opacity="0.5" />
        </g>

        {/* Thiruvalluvar Statue Silhouette (Right Island) */}
        <g opacity="0.56" fill="#052236">
          {/* Rock pedestal */}
          <path d="M1110 246 Q1150 220 1200 222 Q1245 224 1272 246 Z" />
          {/* 38-foot Mandapam pedestal */}
          <rect x="1166" y="188" width="44" height="36" rx="2" />
          <rect x="1173" y="176" width="30" height="12" rx="1" />
          {/* 95-foot Statue silhouette */}
          <path d="M1180 176 L1182 118 Q1188 104 1194 118 L1196 176 Z" />
          <circle cx="1188" cy="108" r="6.5" />
          {/* Raised right hand holding palm-leaf scroll */}
          <path d="M1194 128 L1202 122 L1200 135 Z" />
        </g>

        {/* Ocean Wave Layer 1 */}
        <path
          d="M0 242 C180 218, 360 264, 540 242 C720 220, 900 262, 1080 240 C1260 218, 1360 250, 1440 238 L1440 360 L0 360 Z"
          fill="url(#kkWave1)"
        />

        {/* Ocean Wave Layer 2 */}
        <path
          d="M0 278 C220 252, 420 304, 680 276 C940 248, 1180 298, 1440 272 L1440 360 L0 360 Z"
          className="fill-[#F4F8FB] dark:fill-[#0B1D2E]"
          fillOpacity="0.32"
        />

        {/* Bottom Blend into Page Background */}
        <path
          d="M0 315 C320 290, 620 342, 980 312 C1180 295, 1340 318, 1440 308 L1440 360 L0 360 Z"
          className="fill-[#F4F8FB] dark:fill-[#0B1D2E]"
        />
      </svg>
    </div>
  );
}
