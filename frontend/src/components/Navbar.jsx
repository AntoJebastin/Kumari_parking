import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  MapPin,
  LogIn,
  UserPlus,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Explore Parking', to: '/explore' },
  { label: 'Nearest Map', to: '/nearest' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (to) => {
    setMobileOpen(false);
    if (to.startsWith('/#') && location.pathname === '/') {
      const targetId = to.replace('/#', '');
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="section-container flex h-18 items-center justify-between py-3">
        <Link to="/" className="focus:outline-none">
          <BrandLogo />
        </Link>

        {/* Desktop Links */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary Navigation">
          {NAV_LINKS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => handleNavClick(item.to)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#087CA7] text-white shadow-sm'
                    : 'text-[#102A43] hover:bg-[#087CA7]/10 hover:text-[#087CA7] dark:text-slate-200 dark:hover:bg-sky-400/10 dark:hover:text-sky-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark or light mode"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-[#073B5C] transition hover:border-[#087CA7] hover:text-[#087CA7] dark:border-sky-900/60 dark:bg-[#102A43] dark:text-amber-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="btn-outline !py-2.5 !px-3.5">
                  <ShieldCheck className="h-4 w-4 text-[#F59E0B]" />
                  Admin
                </Link>
              )}
              <Link to="/dashboard" className="btn-primary !py-2.5 !px-4">
                <LayoutDashboard className="h-4 w-4" />
                {user?.full_name?.split(' ')[0] || 'Dashboard'}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#DC2626] hover:bg-red-50 dark:border-sky-900/60 dark:bg-[#102A43]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline !py-2.5 !px-4">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link to="/register" className="btn-sunrise !py-2.5 !px-4">
                <UserPlus className="h-4 w-4" />
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark or light mode"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-[#073B5C] dark:border-sky-900/60 dark:bg-[#102A43] dark:text-amber-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-[#073B5C] dark:border-sky-900/60 dark:bg-[#102A43] dark:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200/70 bg-white dark:border-sky-900/50 dark:bg-[#0B1D2E] lg:hidden"
          >
            <div className="section-container flex flex-col gap-2 py-4">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => handleNavClick(item.to)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[#102A43] hover:bg-[#087CA7]/10 dark:text-slate-200"
                >
                  <MapPin className="h-4 w-4 text-[#087CA7]" />
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2.5 border-t border-slate-200 pt-2 dark:border-sky-900/50">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={isAdmin ? '/admin' : '/dashboard'}
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary !py-2.5"
                    >
                      Dashboard
                    </Link>
                    <button type="button" onClick={handleLogout} className="btn-outline !py-2.5">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-outline !py-2.5"
                    >
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="btn-sunrise !py-2.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
