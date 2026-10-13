import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Heart, Sparkles, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        'Supabase is not configured yet. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      );
      return;
    }

    if (!email || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7FF] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-[#4B315F]">
      {/* Ambient background orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#E6D6FA]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full bg-[#F8D9EB]/40 blur-3xl pointer-events-none" />

      {/* Top back navigation */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#E6D6FA] text-xs font-medium text-[#6D28D9] shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Scrapbook</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#E6D6FA] shadow-xl shadow-purple-950/5 relative z-10"
      >
        {/* Cute Lock Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E6D6FA] to-[#FAF7FF] border border-[#E6D6FA] flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Lock className="w-8 h-8 text-[#6D28D9]" />
        </div>

        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6D28D9] uppercase tracking-wider bg-[#E6D6FA]/60 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3 h-3 text-[#A78BFA]" />
            Private Owner Portal
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#4B315F] tracking-tight">
            Admin Sign In
          </h1>
          <p className="text-xs sm:text-sm text-[#4B315F]/70 font-light mt-1">
            Sign in with your owner account to edit and publish content.
          </p>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-[#4B315F] mb-1.5">
              Owner Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:outline-hidden focus:ring-2 focus:ring-[#A78BFA]/50 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4B315F] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6D6FA] bg-[#FAF7FF] text-xs sm:text-sm text-[#4B315F] focus:outline-hidden focus:ring-2 focus:ring-[#A78BFA]/50 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white font-medium text-xs sm:text-sm shadow-md shadow-purple-900/20 hover:brightness-105 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white text-white" />
                <span>Enter Admin Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E6D6FA]/70 text-center">
          <p className="text-[11px] text-[#4B315F]/60">
            Protected with Row Level Security &amp; Supabase Auth.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
