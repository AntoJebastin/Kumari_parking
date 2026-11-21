import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Mail, Lock, KeyRound } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.full_name}!`);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Enter your email address');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      toast.success(res.message || 'Password reset email sent');
      setForgotMode(false);
      setForgotEmail('');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link');
    }
  };

  return (
    <MainLayout>
      <section className="section-container flex min-h-[78vh] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-7 shadow-card dark:border-sky-900/50 dark:bg-[#102A43] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <BrandLogo showTamil={false} />
            <h1 className="mt-4 font-heading text-2xl font-bold text-[#073B5C] dark:text-white">
              {forgotMode ? 'Reset Your Password' : 'Sign In to Your Account'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              {forgotMode
                ? 'Enter your registered email to receive reset instructions.'
                : 'Access your bookings, digital QR tickets, and instant reservations.'}
            </p>
          </div>

          {forgotMode ? (
            <form onSubmit={handleForgot} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Registered Email
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-[#F4F8FB] py-2.5 pl-10 pr-3.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">
                <KeyRound className="h-4 w-4" />
                Send Reset Instructions
              </button>
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-center text-xs font-semibold text-[#087CA7] hover:underline"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-[#F4F8FB] py-2.5 pl-10 pr-3.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required' })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-[#F4F8FB] py-2.5 pl-10 pr-10 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#087CA7]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    {...register('remember')}
                    defaultChecked
                    className="rounded border-slate-300 text-[#087CA7] focus:ring-[#087CA7]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="font-semibold text-[#087CA7] hover:underline dark:text-sky-300"
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                <LogIn className="h-4 w-4" />
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-center text-xs text-slate-600 dark:text-slate-300">
                Don’t have an account?{' '}
                <Link to="/register" className="font-bold text-[#F59E0B] hover:underline">
                  Create Account
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
