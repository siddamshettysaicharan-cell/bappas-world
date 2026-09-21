/**
 * Initial Player Details / Registration Modal
 * Displayed once on first launch to capture player's Name and College.
 * Normalizes college internally while preserving display text.
 */

import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { registerPlayer } from '../lib/supabase';
import { PlayerProfile } from '../types';

interface Props {
  onComplete: (profile: PlayerProfile) => void;
}

export const PlayerRegistrationModal: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCollege = college.trim();

    if (!trimmedName) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!trimmedCollege) {
      setErrorMsg('Please enter your college / university.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    soundEngine.playClick();

    try {
      const profile = await registerPlayer(trimmedName, trimmedCollege);
      soundEngine.playEnterChapter();
      onComplete(profile);
    } catch (err) {
      console.warn('[Registration] Failed:', err);
      // Fallback
      const fallback: PlayerProfile = {
        id: 'player_' + Date.now(),
        name: trimmedName,
        college: trimmedCollege,
        college_normalized: trimmedCollege.toLowerCase(),
      };
      onComplete(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#3E3028] via-[#2A1F1A] to-[#1E1410] border-2 border-[#C6A15B] rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(198,161,91,0.3)] text-stone-100">
        {/* Header Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-full bg-[#7A2E2E]/60 border-2 border-[#C6A15B] flex items-center justify-center text-3xl shadow-inner">
            🪔
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-center text-[#E8C766] tracking-wider uppercase">
          Devotee Registration
        </h2>
        <p className="text-xs sm:text-sm text-center text-[#F6EBD8]/80 font-outfit mt-1 mb-4">
          Enter your details to join the campus leaderboard and celebrate Ganesh Chaturthi!
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-cinzel font-bold text-[#C6A15B] uppercase tracking-wider mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sai Charan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#C6A15B]/50 focus:border-[#E8C766] focus:ring-1 focus:ring-[#E8C766] text-[#F6EBD8] font-outfit text-sm outline-none transition-all placeholder:text-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-cinzel font-bold text-[#C6A15B] uppercase tracking-wider mb-1">
              College / University
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. St. Mary's University"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-[#C6A15B]/50 focus:border-[#E8C766] focus:ring-1 focus:ring-[#E8C766] text-[#F6EBD8] font-outfit text-sm outline-none transition-all placeholder:text-stone-500"
            />
            <span className="text-[11px] text-[#F6EBD8]/60 font-outfit mt-1 block">
              Free text entry — students and devotees from any campus can participate.
            </span>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-outfit text-center">
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !college.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C98232] via-[#E8C766] to-[#C98232] hover:from-[#E8C766] hover:to-[#C98232] disabled:opacity-50 disabled:cursor-not-allowed text-[#3E3028] font-cinzel font-black text-sm tracking-widest uppercase shadow-[0_4px_16px_rgba(198,161,91,0.4)] transition-all transform hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Registering...</span>
              ) : (
                <>
                  <span>CONTINUE</span>
                  <span>▶</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
