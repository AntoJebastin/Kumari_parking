import React from 'react';

export default function BrandLogo({ showTamil = true, lightText = false, size = 'md' }) {
  const iconSize = size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-12 w-12' : 'h-11 w-11';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Custom Kanyakumari Emblem Icon */}
      <div
        className={`${iconSize} relative overflow-hidden rounded-full shadow-md ring-2 ring-[#F59E0B]/70 bg-white shrink-0`}
      >
        <img
          src="/kumari-icon.jpg"
          alt="Kumari Parking Logo"
          className="h-full w-full object-cover scale-110"
        />
      </div>

      <div className="flex flex-col leading-tight">
        <span
          className={`${titleSize} font-heading font-bold tracking-tight ${
            lightText ? 'text-white' : 'text-[#073B5C] dark:text-white'
          }`}
        >
          Kumari <span className="text-[#F59E0B]">Parking</span>
        </span>
        {showTamil && (
          <span
            className={`text-[11px] font-medium ${
              lightText ? 'text-sky-200/90' : 'text-[#087CA7] dark:text-sky-300'
            }`}
          >
            குமரி பார்க்கிங் • Kanyakumari
          </span>
        )}
      </div>
    </div>
  );
}
