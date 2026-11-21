import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ShieldCheck, IndianRupee } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#073B5C] text-slate-200">
      <div className="section-container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <BrandLogo lightText />
            <p className="text-sm leading-relaxed text-sky-100/80">
              Smart Parking Slot Reservation &amp; Management Platform built for residents,
              pilgrims, and travelers across Kanyakumari District, Tamil Nadu.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-amber-300">
              <IndianRupee className="h-3.5 w-3.5" />
              100% INR (₹) Razorpay Verified Payments
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-sky-100/80">
              <li>
                <Link to="/nearest" className="transition hover:text-[#F59E0B]">
                  Find Nearest Parking
                </Link>
              </li>
              <li>
                <Link to="/explore" className="transition hover:text-[#F59E0B]">
                  Explore Parking Locations
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="transition hover:text-[#F59E0B]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="transition hover:text-[#F59E0B]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition hover:text-[#F59E0B]">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="transition hover:text-[#F59E0B]">
                  My Bookings &amp; Tickets
                </Link>
              </li>
              <li>
                <Link to="/admin" className="transition hover:text-[#F59E0B]">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Coverage */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              Kanyakumari Coverage
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-sky-100/80">
              <li>Vivekananda Rock Ferry Terminal</li>
              <li>Kanyakumari Beach &amp; Sunrise Point</li>
              <li>Nagercoil Town &amp; Vadasery</li>
              <li>Suchindram Temple Zone</li>
              <li>Marthandam &amp; Colachel</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              District Support
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-sky-100/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
                <span>Villukuri, Kanyakumari District, Tamil Nadu 629702, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#F59E0B]" />
                <a href="mailto:antowilpet18@gmail.com" className="hover:text-[#F59E0B]">
                  antowilpet18@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#F59E0B]" />
                <span>+91 9500977950</span>
              </li>
              <li className="flex items-center gap-2.5 text-xs text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Only Admin-Verified Parking Facilities Listed</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-xs text-sky-200/75 sm:flex-row">
          <p>© {year} Kumari Parking. All rights reserved. Find Your Spot. Park with Confidence.</p>
          <p>வந்தாரை வாழவைக்கும் குமரி • Made for Kanyakumari District</p>
        </div>
      </div>
    </footer>
  );
}
