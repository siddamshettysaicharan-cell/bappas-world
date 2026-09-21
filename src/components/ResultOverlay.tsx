/**
 * In-Game Result / Chapter Complete Screen
 * Displays accurate score, combos, items gathered, and local records
 * with replay and return to Ganesha World controls positioned at the TOP of the card.
 */

import React from 'react';
import { soundEngine } from '../audio/soundEngine';
import { CHAPTERS_DATA } from '../game/constants';
import { FeastGameResult } from '../types';

interface Props {
  result: FeastGameResult;
  onPlayAgain: () => void;
  onReturnToWorld: () => void;
  onOpenLeaderboard?: () => void;
}

export const ResultOverlay: React.FC<Props> = ({ result, onPlayAgain, onReturnToWorld, onOpenLeaderboard }) => {
  const chapter = CHAPTERS_DATA[result.chapterId];
  const mins = Math.floor(result.timeSurvivedSeconds / 60);
  const secs = result.timeSurvivedSeconds % 60;
  const timeFormatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

  const handleReplay = () => {
    soundEngine.playEnterChapter();
    onPlayAgain();
  };

  const handleReturn = () => {
    soundEngine.playTempleBell(1.0);
    onReturnToWorld();
  };

  const handleLeaderboard = () => {
    soundEngine.playClick();
    if (onOpenLeaderboard) {
      onOpenLeaderboard();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-lg sm:max-w-xl landscape:max-w-xl max-h-[92vh] overflow-y-auto bg-[#3E3028] border-2 border-[#C6A15B] rounded-3xl p-4 sm:p-6 shadow-2xl text-center">
        {/* Action Buttons AT THE TOP OF THE RESULT CARD */}
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-2.5 mb-3 pb-3 border-b border-[#C6A15B]/30">
          <button
            onClick={handleReturn}
            className="flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-[#7A2E2E] border border-[#C6A15B] hover:bg-[#7A2E2E]/80 text-[#F6EBD8] font-cinzel font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer whitespace-nowrap"
          >
            ← WORLD
          </button>
          {onOpenLeaderboard && (
            <button
              onClick={handleLeaderboard}
              className="py-2 sm:py-2.5 px-3 rounded-xl bg-[#244A3A] border border-[#C6A15B] hover:bg-[#244A3A]/80 text-[#E8C766] font-cinzel font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>🏆</span>
              <span className="hidden sm:inline">LEADERBOARD</span>
            </button>
          )}
          <button
            onClick={handleReplay}
            className="flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#C98232] via-[#E8C766] to-[#C98232] text-[#3E3028] font-cinzel font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            {result.chapterId === 'unstoppable_scribe' && !result.completed ? 'RETRY ↺' : 'PLAY AGAIN ↺'}
          </button>
        </div>

        {/* Divine Emblem Banner */}
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7A2E2E]/50 border-2 border-[#C6A15B] mb-2 sm:mb-3 text-2xl sm:text-3xl shadow-inner">
          {chapter.icon}
        </div>

        <h2 className="text-2xl sm:text-3xl font-cinzel font-black text-[#E8C766] tracking-wider uppercase">
          {result.chapterId === 'unstoppable_scribe'
            ? (result.completed ? '📜 BAPPA’S BOOK COMPLETED!' : (result.reason === 'time_up' ? "TIME'S UP!" : 'THE WRITING STOPPED'))
            : (result.chapterId === 'mushaks_adventure'
                ? 'GAME OVER'
                : (result.chapterId === 'kubera_feast' ? 'FEAST OVER' : `${chapter.title} COMPLETE`))}
        </h2>
        <p className="text-[#F6EBD8] font-outfit text-xs sm:text-sm font-medium mt-1">
          {result.chapterId === 'unstoppable_scribe'
            ? (result.completed
                ? 'Ganesha completed the sacred manuscript without stopping.'
                : (result.reason === 'time_up'
                    ? 'Time ran out before the verse was inscribed! Sage Vyasa’s sacred dictation must never pause.'
                    : 'The writing stopped, but the eternal epic awaits.'))
            : (result.chapterId === 'mushaks_adventure'
                ? 'Mushika ran bravely through the sacred festival trail!'
                : `${chapter.title} • ${chapter.locationName}`)}
        </p>

        {/* Manuscript Progress Pill for Scribe Chapter */}
        {result.chapterId === 'unstoppable_scribe' && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-[#244A3A]/60 border border-[#C6A15B] text-[#F6EBD8] font-cinzel text-xs font-bold tracking-wider">
            <span>📖</span>
            <span>MANUSCRIPT: {result.completed ? '100%' : `${result.manuscriptProgress ?? 0}%`} {result.completed ? 'COMPLETED' : 'WRITTEN'}</span>
          </div>
        )}

        {/* New High Score Badge */}
        {result.isNewBest && result.score > 0 && (
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-[#244A3A]/60 border border-[#C6A15B] text-[#E8C766] text-xs font-cinzel font-bold tracking-widest animate-pulse">
            ★ NEW PERSONAL BEST RECORD! ★
          </div>
        )}

        {/* Score Grid */}
        <div className="my-3 sm:my-4 grid grid-cols-2 gap-2 sm:gap-3 text-left">
          {/* Main Score */}
          <div className="col-span-2 bg-[#244A3A]/40 border border-[#C6A15B]/50 rounded-2xl p-2.5 sm:p-3 text-center">
            <span className="text-[#C6A15B] font-cinzel text-xs uppercase tracking-widest block">
              FINAL SCORE
            </span>
            <span className="text-3xl sm:text-4xl font-outfit font-black text-[#F6EBD8]">
              {result.score}
            </span>
            {result.previousBest > 0 && (
              <span className="text-[#E8C766] text-xs block mt-0.5 font-outfit">
                Previous Record: {result.previousBest}
              </span>
            )}
          </div>

          {result.chapterId === 'unstoppable_scribe' ? (
            <>
              {/* WPM */}
              <div className="bg-black/35 border border-[#C6A15B]/30 rounded-xl p-2 sm:p-3">
                <span className="text-[#C6A15B] font-cinzel text-xs block">
                  TYPING SPEED
                </span>
                <span className="text-lg sm:text-xl font-outfit font-bold text-[#F6EBD8] mt-0.5 block">
                  ⚡ {result.wpm ?? 0} WPM
                </span>
              </div>

              {/* Accuracy */}
              <div className="bg-black/35 border border-[#C6A15B]/30 rounded-xl p-2 sm:p-3">
                <span className="text-[#C6A15B] font-cinzel text-xs block">
                  ACCURACY
                </span>
                <span className="text-lg sm:text-xl font-outfit font-bold text-[#E8C766] mt-0.5 block">
                  🎯 {result.accuracy ?? 100}%
                </span>
              </div>

              {/* Best Combo */}
              <div className="bg-black/35 border border-[#C6A15B]/30 rounded-xl p-2 sm:p-3">
                <span className="text-[#C6A15B] font-cinzel text-xs block">
                  BEST COMBO
                </span>
                <span className="text-lg sm:text-xl font-outfit font-bold text-[#F6EBD8] mt-0.5 block">
                  🔥 x{result.bestCombo}
                </span>
              </div>

              {/* Time Taken */}
              <div className="bg-black/35 border border-[#C6A15B]/30 rounded-xl p-2 sm:p-3">
                <span className="text-[#C6A15B] font-cinzel text-xs block">
                  TIME TAKEN
                </span>
                <span className="text-lg sm:text-xl font-outfit font-bold text-[#F6EBD8] mt-0.5 block">
                  ⏱️ {timeFormatted}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Food Collected */}
              <div className="bg-black/35 border border-[#C6A15B]/30 rounded-xl p-2 sm:p-3">
                <span className="text-[#C6A15B] font-cinzel text-xs block">
                  {result.chapterId === 'kubera_feast'
                    ? 'FOOD COLLECTED'
                    : (result.chapterId === 'mushaks_adventure' ? 'MODAKS COLLECTED' : 'MODAKS GATHERED')}
                </span>
                <span className="text-lg sm:text-xl font-outfit font-bold text-[#E8C766] mt-0.5 block">
                  {result.chapterId === 'mushaks_adventure'
                    ? `🥟 ${result.modaksCollected ?? result.foodCollected}`
                    : `🥟 ${result.foodCollected}`}
                </span>
              </div>

              {/* Best Combo */}
              <div className="bg-black/35 border border-[#C6A15B]/30 rounded-xl p-2 sm:p-3">
                <span className="text-[#C6A15B] font-cinzel text-xs block">
                  MAX COMBO
                </span>
                <span className="text-lg sm:text-xl font-outfit font-bold text-[#F6EBD8] mt-0.5 block">
                  ⚡ x{result.bestCombo}
                </span>
              </div>

              {/* Time Survived */}
              <div className="col-span-2 bg-black/35 border border-[#C6A15B]/30 rounded-xl p-2 sm:p-3 flex items-center justify-between">
                <span className="text-[#C6A15B] font-cinzel text-xs">
                  TIME SURVIVED
                </span>
                <span className="text-sm sm:text-base font-outfit font-bold text-[#F6EBD8]">
                  ⏱️ {timeFormatted}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Why This Game / Wisdom Reflection */}
        <div className="text-xs text-[#F6EBD8]/90 italic mb-1 font-outfit border-t border-[#C6A15B]/30 pt-2 sm:pt-3">
          "{chapter.storyParchment.narrative}"
        </div>
      </div>
    </div>
  );
};
