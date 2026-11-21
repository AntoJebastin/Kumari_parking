import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Clock,
  Navigation,
  ShieldCheck,
  Car,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatINR, formatDistance } from '../utils/formatters';

const STATUS_STYLES = {
  Available: 'bg-emerald-500/90 text-white',
  Full: 'bg-red-600/90 text-white',
  Closed: 'bg-slate-700/90 text-white',
  'Temporarily Unavailable': 'bg-amber-600/90 text-white',
};

export default function ParkingCard({ location, distanceKm, onOpenReviews }) {
  const statusClass = STATUS_STYLES[location.status] || 'bg-slate-600 text-white';
  const isBookable = location.status === 'Available' && location.available_slots > 0;
  const occupancyPct =
    location.total_slots > 0
      ? Math.round((location.available_slots / location.total_slots) * 100)
      : 0;
  const formattedDist = formatDistance(distanceKm ?? location.distance_km);

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover dark:border-sky-900/50 dark:bg-[#102A43]"
    >
      {/* Image Header */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-navy-surface">
        <img
          src={location.image_url}
          alt={location.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#073B5C]/80 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusClass}`}>
            {location.status}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#073B5C] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
            Verified
          </span>
        </div>

        {/* Bottom Overlay: Price & Distance */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="rounded-xl bg-[#073B5C]/90 px-3 py-1.5 text-white backdrop-blur-sm">
            <span className="font-heading text-lg font-bold text-[#F59E0B]">
              {formatINR(location.price_per_hour)}
            </span>
            <span className="text-xs text-sky-100"> / hr</span>
          </div>

          {formattedDist && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Navigation className="h-3 w-3 text-[#F59E0B]" />
              {formattedDist}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-bold text-[#102A43] dark:text-white line-clamp-1">
            {location.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            {Number(location.average_rating || 0).toFixed(1)}
          </div>
        </div>

        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#087CA7]" />
          {location.address}
        </p>

        {/* Availability Meter */}
        <div className="mt-4 rounded-xl bg-[#F4F8FB] p-3 dark:bg-[#0B1D2E]/70">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-300">Available Slots</span>
            <span
              className={`font-bold ${
                isBookable ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}
            >
              {location.available_slots} / {location.total_slots} free
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPct > 25 ? 'bg-[#16A34A]' : occupancyPct > 0 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
              }`}
              style={{ width: `${Math.min(100, Math.max(occupancyPct, isBookable ? 8 : 0))}%` }}
            />
          </div>
        </div>

        {/* Meta Info */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#087CA7]" />
            {location.opening_time} – {location.closing_time}
          </span>
          <span className="inline-flex items-center gap-1">
            <Car className="h-3.5 w-3.5 text-[#087CA7]" />
            {(location.vehicle_types || []).slice(0, 2).join(', ')}
            {(location.vehicle_types || []).length > 2 ? ' +' : ''}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-sky-900/40">
          <button
            type="button"
            onClick={() => onOpenReviews && onOpenReviews(location)}
            className="btn-outline flex-1 !py-2.5 !px-3 !text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Reviews ({location.total_reviews || 0})
          </button>

          {isBookable ? (
            <Link
              to={`/booking/${location.id}`}
              className="btn-primary flex-1 !py-2.5 !px-3 !text-xs"
            >
              Book Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="btn-primary flex-1 !py-2.5 !px-3 !text-xs !bg-slate-400"
            >
              {location.status === 'Full' ? 'Lot Full' : 'Unavailable'}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
