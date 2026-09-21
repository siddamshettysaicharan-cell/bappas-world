/**
 * In-Game Story Introduction Overlay
 * Displaying exact chapter names, icons, short instructions,
 * controls, and culturally authentic "Why This Game?" background.
 */

import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { CHAPTERS_DATA } from '../game/constants';
import { ChapterId } from '../types';

interface Props {
  chapterId: ChapterId;
  onStartChapter: () => void;
  onClose: () => void;
}

export const StoryIntroOverlay: React.FC<Props> = ({ chapterId, onStartChapter, onClose }) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const chapter = CHAPTERS_DATA[chapterId];

  const handleStart = () => {
    soundEngine.playEnterChapter();
    onStartChapter();
  };

  const handleBack = () => {
    soundEngine.playClick();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg sm:max-w-xl landscape:max-w-xl max-h-[92vh] overflow-y-auto bg-[#3E3028] border-2 border-[#C6A15B] rounded-3xl p-4 sm:p-6 shadow-2xl text-center flex flex-col items-center">
        {/* Header Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7A2E2E]/50 border-2 border-[#C6A15B] mb-2 sm:mb-3 text-2xl sm:text-3xl shadow-inner">
          {chapter.icon}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-3xl font-cinzel font-black text-[#E8C766] tracking-wider uppercase">
          {chapter.title}
        </h2>

        {/* Short Instruction Subtitle */}
        <p className="text-[#F6EBD8] font-outfit text-xs sm:text-sm font-semibold tracking-wide mt-1 px-2">
          “{chapter.storyParchment.instructions[0]}”
        </p>

        {/* Objectives & Controls Box */}
        <div className="w-full my-3 sm:my-4 bg-black/35 border border-[#C6A15B]/30 rounded-2xl p-3 sm:p-4 text-left font-outfit space-y-2 text-[#F6EBD8]">
          <div className="flex items-start gap-2 text-xs sm:text-sm">
            <span className="text-[#E8C766] font-bold">🎯</span>
            <span className="font-medium text-[#F6EBD8]">
              {chapter.storyParchment.instructions[0]}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm border-t border-[#C6A15B]/20 pt-2 text-[#E8C766]">
            <span className="font-bold">🎮</span>
            <span className="font-semibold text-xs sm:text-sm">
              {chapter.storyParchment.instructions[1] || 'Controls: Move / Touch'}
            </span>
          </div>
        </div>

        {/* Big Start CTA */}
        <button
          onClick={handleStart}
          className="w-full py-2.5 sm:py-3 px-6 rounded-2xl bg-gradient-to-r from-[#C98232] via-[#E8C766] to-[#C98232] text-[#3E3028] font-cinzel font-black text-base sm:text-lg tracking-wider shadow-md transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          START GAME ▶
        </button>

        {/* Secondary Actions: Return to World & WHY THIS GAME? */}
        <div className="flex items-center justify-between w-full mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[#C6A15B]/30 text-xs sm:text-sm">
          <button
            onClick={handleBack}
            className="text-[#F6EBD8]/80 hover:text-[#E8C766] transition-colors font-outfit font-medium cursor-pointer py-1"
          >
            ← Return to World
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowWhyModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[#C6A15B]/50 bg-[#7A2E2E]/40 hover:bg-[#7A2E2E]/70 text-[#E8C766] font-cinzel text-xs font-bold transition-colors cursor-pointer"
          >
            <span>📖</span> WHY THIS GAME?
          </button>
        </div>

        {/* "Why This Game?" Popover Modal */}
        {showWhyModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs rounded-3xl animate-in fade-in duration-200">
            <div className="max-h-[85vh] overflow-y-auto bg-[#3E3028] border-2 border-[#C6A15B] rounded-2xl p-5 text-center shadow-2xl max-w-sm">
              <span className="text-2xl block mb-2">{chapter.icon}</span>
              <h3 className="text-base sm:text-lg font-cinzel font-bold text-[#E8C766] mb-2">
                Why This Game?
              </h3>
              <p className="text-[#F6EBD8] font-outfit text-xs sm:text-sm leading-relaxed px-2 mb-4 sm:mb-5">
                {chapter.storyParchment.narrative}
              </p>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowWhyModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C98232] via-[#E8C766] to-[#C98232] text-[#3E3028] font-cinzel font-bold text-xs sm:text-sm tracking-wide cursor-pointer shadow-md"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
