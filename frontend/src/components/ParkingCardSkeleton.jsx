import React from 'react';

export default function ParkingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
      <div className="skeleton-shimmer h-48 w-full" />
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="skeleton-shimmer h-5 w-3/4 rounded-md" />
          <div className="skeleton-shimmer h-5 w-10 rounded-md" />
        </div>
        <div className="skeleton-shimmer h-4 w-full rounded-md" />
        <div className="skeleton-shimmer h-14 w-full rounded-xl" />
        <div className="flex gap-2.5 pt-2">
          <div className="skeleton-shimmer h-10 flex-1 rounded-xl" />
          <div className="skeleton-shimmer h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
