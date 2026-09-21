/**
 * In-Game Sacred Stories Journal & Achievements
 * Royal illuminated manuscript displaying all 5 stories of wisdom,
 * player records, and the cultural significance of Ganesh Chaturthi.
 */

import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { CHAPTERS_DATA } from '../game/constants';
import { ChapterId } from '../types';
import { GameStorage } from '../utils/storage';

interface Props {
  onClose: () => void;
  onSelectChapter: (chapterId: ChapterId) => void;
}

export const StoryJournalModal: React.FC<Props> = ({ onClose, onSelectChapter }) => {
  const [selectedId, setSelectedId] = useState<ChapterId>('kubera_feast');
  const chapterKeys = Object.keys(CHAPTERS_DATA) as ChapterId[];
  const activeChapter = CHAPTERS_DATA[selectedId];

  const handleSelectTab = (id: ChapterId) => {
    soundEngine.playClick();
    setSelectedId(id);
  };

  const handleStartChapter = () => {
    soundEngine.playEnterChapter();
    onSelectChapter(selectedId);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#3E3028] border-2 border-[#C6A15B] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#C6A15B]/30 bg-black/25">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#E8C766]">
                CHRONICLES OF GANESHA
              </h2>
              <p className="text-xs font-outfit text-[#F6EBD8]/80">
                Stories of Wisdom, Humility & Devotion
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full border border-[#C6A15B]/40 flex items-center justify-center text-[#F6EBD8] hover:bg-[#7A2E2E]/50 text-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body: Sidebar Chapters + Details */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Chapter Selector Tabs */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[#C6A15B]/20 p-3 space-y-2 overflow-y-auto bg-black/20">
            {chapterKeys.map(id => {
              const chap = CHAPTERS_DATA[id];
              const isSelected = selectedId === id;
              const highScore = GameStorage.getHighScore(id);
              const isDone = GameStorage.isChapterCompleted(id);

              return (
                <button
                  key={id}
                  onClick={() => handleSelectTab(id)}
                  className={`w-full p-2.5 sm:p-3 rounded-xl text-left transition-all border flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#7A2E2E]/60 border-[#C6A15B] text-[#F6EBD8] shadow-md'
                      : 'bg-black/25 border-[#C6A15B]/20 hover:border-[#C6A15B]/50 text-[#F6EBD8]/80'
                  }`}
                >
                  <span className="text-2xl">{chap.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-cinzel text-xs font-bold truncate">
                      {chap.title}
                    </div>
                    <div className="text-[10px] text-[#F6EBD8]/70 truncate font-outfit">
                      {chap.locationName}
                    </div>
                    {highScore > 0 && (
                      <div className="text-[10px] text-[#E8C766] font-bold mt-0.5">
                        Best: {highScore} pts {isDone ? '★' : ''}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Chapter Details */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">{activeChapter.icon}</span>
              <div>
                <h3 className="text-lg sm:text-xl font-cinzel font-bold text-[#E8C766]">
                  {activeChapter.title}
                </h3>
                <p className="text-xs text-[#F6EBD8]/80 font-outfit">
                  {activeChapter.subtitle}
                </p>
              </div>
            </div>

            {/* Narrative Box */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#244A3A]/40 border border-[#C6A15B]/40 font-outfit text-xs sm:text-sm text-[#F6EBD8] leading-relaxed italic">
              "{activeChapter.storyParchment.narrative}"
            </div>

            {/* Sacred Lesson */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[#7A2E2E]/40 border border-[#C6A15B]/30">
              <span className="text-[#E8C766] text-xs font-bold uppercase tracking-wider block mb-1">
                Sacred Moral
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#F6EBD8]">
                {activeChapter.storyParchment.moral}
              </p>
            </div>

            {/* Chapter Instructions */}
            <div className="p-3 sm:p-4 rounded-xl bg-black/35 border border-[#C6A15B]/30">
              <h4 className="text-xs uppercase font-cinzel font-bold text-[#E8C766] mb-2">
                Gameplay Objective
              </h4>
              <ul className="space-y-1.5 text-xs text-[#F6EBD8]/90 font-outfit">
                {activeChapter.storyParchment.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#E8C766]">•</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleStartChapter}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C98232] via-[#E8C766] to-[#C98232] text-[#3E3028] font-cinzel font-bold text-xs sm:text-sm shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                ENTER STORY LOCATION ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
