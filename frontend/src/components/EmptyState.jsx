import React from 'react';
import { MapPinOff } from 'lucide-react';

export default function EmptyState({
  icon: Icon = MapPinOff,
  title = 'No parking locations found',
  description = 'Try clearing your search filters or exploring another landmark in Kanyakumari District.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center dark:border-sky-800/70 dark:bg-[#102A43]/60">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#087CA7]/10 text-[#087CA7] dark:bg-sky-400/10 dark:text-sky-300">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-[#102A43] dark:text-white">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-300">
        {description}
      </p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-primary mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
