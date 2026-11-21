import React from 'react';
import { motion } from 'framer-motion';

/**
 * Crisp, zero-blur parking-themed animated heading for Home & Inner pages.
 * Uses a sharp dark-navy text backing and clean solid colors so text stays
 * crystal-clear over bright daylight photography.
 */
export default function ParkingAnimatedHeading({
  prefix = '',
  highlight = '',
  suffix = '',
  align = 'center',
  size = 'hero', // 'hero' | 'page'
}) {
  const words = prefix ? prefix.trim().split(' ') : [];
  const suffixWords = suffix ? suffix.trim().split(' ') : [];

  const textSize =
    size === 'hero'
      ? 'text-2xl sm:text-4xl lg:text-5xl'
      : 'text-2xl sm:text-3xl lg:text-4xl';

  const alignClass = align === 'left' ? 'items-start text-left' : 'items-center text-center';
  const justifyClass = align === 'left' ? 'justify-start' : 'justify-center';

  return (
    <div className={`flex flex-col ${alignClass}`}>
      <div className="inline-block rounded-2xl bg-[#073B5C]/80 px-5 py-3 shadow-lg border border-white/20">
        <h1
          className={`font-parking-display ${textSize} font-extrabold tracking-wide text-white leading-tight`}
          style={{ textShadow: '0 2px 0 rgba(7, 59, 92, 0.95)' }}
        >
          <span className={`inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 ${justifyClass}`}>
            {/* Crisp Animated Parking Sign P Emblem */}
            <motion.span
              initial={{ scale: 0.7, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              className="inline-flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#F59E0B] text-[#073B5C] shadow-md text-lg sm:text-2xl font-black"
              aria-hidden="true"
            >
              P
            </motion.span>

            {words.map((word, idx) => (
              <motion.span
                key={`pre-${idx}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx, duration: 0.28 }}
                className="inline-block text-white"
              >
                {word}
              </motion.span>
            ))}

            {highlight && (
              <motion.span
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * words.length + 0.06, duration: 0.32 }}
                className="inline-block text-[#FDE047]"
              >
                {highlight}
              </motion.span>
            )}

            {suffixWords.map((word, idx) => (
              <motion.span
                key={`suf-${idx}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * (words.length + idx + 1) + 0.08, duration: 0.28 }}
                className="inline-block text-white"
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>
      </div>

      {/* Moving Dashed Parking Lane Underline */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="parking-lane-bar mt-3 w-44 sm:w-56 origin-left"
        aria-hidden="true"
      />
    </div>
  );
}
