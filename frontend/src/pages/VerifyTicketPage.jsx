import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Car, MapPin, Clock, ShieldCheck } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyTicketPage() {
  const { token } = useParams();
  const { isAdmin } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tickets/verify/${token}`);
      setResult(res.data);
    } catch {
      setResult({ is_valid: false, reason: 'Unable to verify ticket token.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [token]);

  const handleCheckIn = async () => {
    try {
      await api.post(`/tickets/verify/${token}/checkin`);
      toast.success('Vehicle checked in successfully!');
      loadTicket();
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    }
  };

  return (
    <MainLayout>
      <section className="section-container flex min-h-[72vh] items-center justify-center py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
          {loading ? (
            <p className="text-center text-sm text-slate-500">Verifying QR parking pass...</p>
          ) : result?.is_valid ? (
            <div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-[#16A34A]">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <span className="mt-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  VALID PARKING TICKET
                </span>
                <h1 className="mt-2 font-heading text-2xl font-bold text-[#073B5C] dark:text-white">
                  {result.booking_reference}
                </h1>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl bg-[#F4F8FB] p-4 text-sm dark:bg-[#0B1D2E]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Car className="h-4 w-4 text-[#087CA7]" /> Vehicle
                  </span>
                  <span className="font-bold">
                    {result.vehicle_number} ({result.vehicle_type})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-4 w-4 text-[#087CA7]" /> Location
                  </span>
                  <span className="font-semibold text-right">{result.parking_location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Slot Number</span>
                  <span className="font-heading font-extrabold text-[#073B5C] dark:text-amber-300">
                    {result.slot_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-4 w-4 text-[#F59E0B]" /> Entry
                  </span>
                  <span className="font-medium">
                    {new Date(result.entry_time).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-4 w-4 text-[#F59E0B]" /> Exit
                  </span>
                  <span className="font-medium">
                    {new Date(result.exit_time).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-[#16A34A]">
                    {result.booking_status} {result.is_used ? '(Checked In)' : ''}
                  </span>
                </div>
              </div>

              {isAdmin && !result.is_used && (
                <button type="button" onClick={handleCheckIn} className="btn-primary mt-5 w-full">
                  <ShieldCheck className="h-4 w-4" />
                  Mark Vehicle Checked-In (Staff)
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-[#DC2626]">
                <XCircle className="h-9 w-9" />
              </div>
              <span className="mt-3 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                INVALID TICKET
              </span>
              <h1 className="mt-2 font-heading text-xl font-bold text-[#102A43] dark:text-white">
                Verification Failed
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {result?.reason || 'This QR parking pass is invalid or expired.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
