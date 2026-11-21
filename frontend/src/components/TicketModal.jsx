import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { X, Download, Printer, CheckCircle2, MapPin, Car, Clock, Navigation, Mail } from 'lucide-react';
import BrandLogo from './BrandLogo';
import api from '../services/api';
import { formatINR } from '../utils/formatters';

export default function TicketModal({ ticket, onClose }) {
  const ticketRef = useRef(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  if (!ticket) return null;

  const handleEmailTicket = async () => {
    setSendingEmail(true);
    try {
      const res = await api.post(`/tickets/${ticket.booking_id}/resend-email`);
      if (res?.data?.driver?.delivered) {
        toast.success(`Ticket sent to ${ticket.customer_email}!`);
      } else {
        toast.error(res?.message || 'Email delivery blocked by provider settings.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send ticket email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;
    const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth() - 24;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 12, 14, pdfWidth, pdfHeight);
    pdf.save(`Kumari-Parking-Ticket-${ticket.booking_reference}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl"
      >
        {/* Boarding Pass Ticket Container */}
        <div
          ref={ticketRef}
          className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200"
        >
          {/* Top Ocean Header */}
          <div className="bg-gradient-to-r from-[#073B5C] via-[#087CA7] to-[#0B8EBA] p-6 text-white">
            <div className="flex items-start justify-between">
              <BrandLogo lightText size="sm" />
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  CONFIRMED PASS
                </span>
                <p className="mt-1.5 font-mono text-xs text-sky-100">
                  REF: <strong>{ticket.booking_reference}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 text-[#102A43]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3 flex-1">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Parking Location &amp; Navigation
                  </p>
                  <p className="font-heading text-base font-bold text-[#073B5C]">
                    {ticket.parking_name}
                  </p>
                  <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#087CA7]" />
                    <span>{ticket.parking_address}</span>
                  </p>
                  {ticket.parking_latitude && ticket.parking_longitude && (
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      GPS: {Number(ticket.parking_latitude).toFixed(4)}, {Number(ticket.parking_longitude).toFixed(4)}
                    </p>
                  )}
                  {(ticket.navigation_url || ticket.google_maps_url) && (
                    <a
                      href={ticket.navigation_url || ticket.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#087CA7]/10 px-3 py-1.5 text-xs font-bold text-[#073B5C] transition hover:bg-[#087CA7] hover:text-white"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Get Turn-by-Turn Directions (Google Maps)
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F4F8FB] p-3.5 text-xs">
                  <div>
                    <p className="text-slate-400">Slot Number</p>
                    <p className="font-heading text-lg font-extrabold text-[#073B5C]">
                      {ticket.slot_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Amount Paid</p>
                    <p className="font-heading text-lg font-extrabold text-[#16A34A]">
                      {formatINR(ticket.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Vehicle</p>
                    <p className="font-bold flex items-center gap-1">
                      <Car className="h-3.5 w-3.5 text-[#087CA7]" />
                      {ticket.vehicle_number}
                    </p>
                    <p className="text-[11px] text-slate-500">{ticket.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Duration</p>
                    <p className="font-bold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#F59E0B]" />
                      {ticket.duration_hours} hrs
                    </p>
                    <p className="text-[11px] text-slate-500">{ticket.booking_date}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Stub */}
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4">
                <QRCode
                  value={ticket.qr_payload || ticket.verification_token}
                  size={136}
                  fgColor="#073B5C"
                />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Scan at Entry Gate
                </p>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="my-5 border-t-2 border-dashed border-slate-200" />

            {/* Customer & Timing Details */}
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div>
                <p className="text-slate-400">Driver Name</p>
                <p className="font-semibold">{ticket.customer_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Mobile</p>
                <p className="font-semibold">{ticket.customer_phone}</p>
              </div>
              <div>
                <p className="text-slate-400">Payment Status</p>
                <p className="font-bold uppercase text-[#16A34A]">{ticket.payment_status}</p>
              </div>
              <div>
                <p className="text-slate-400">Entry Time</p>
                <p className="font-semibold">
                  {new Date(ticket.entry_time).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Exit Time</p>
                <p className="font-semibold">
                  {new Date(ticket.exit_time).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Email</p>
                <p className="font-semibold truncate">{ticket.customer_email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex gap-2.5">
            <button type="button" onClick={handleDownloadPDF} className="btn-sunrise">
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleEmailTicket}
              disabled={sendingEmail}
              className="btn-primary"
            >
              <Mail className="h-4 w-4" />
              {sendingEmail ? 'Sending...' : 'Email Ticket'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-outline !bg-white !text-[#073B5C]"
            >
              <Printer className="h-4 w-4" />
              Print Ticket
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/30"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
