/**
 * Live Cross-Campus Leaderboard Modal
 * Shows global (All Campuses) and campus-filtered (My Campus) rankings
 * for each of the five festival mini-games with live refresh.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { fetchGameLeaderboard, normalizeCollege } from '../lib/supabase';
import { LeaderboardEntry, PlayerProfile } from '../types';

interface Props {
  playerProfile: PlayerProfile | null;
  initialGameId?: string;
  onClose: () => void;
}

interface GameOption {
  id: string;
  title: string;
  icon: string;
}

const GAMES: GameOption[] = [
  { id: 'kubera_feast', title: 'Kubera’s Feast', icon: '🥟' },
  { id: 'great_race', title: 'Bappa’s Journey', icon: '🌊' },
  { id: 'mushaks_adventure', title: 'Mushika Run', icon: '🐭' },
  { id: 'unstoppable_scribe', title: 'Bappa’s Book', icon: '📖' },
  { id: 'the_gatekeeper', title: 'Bappa Match', icon: '🎴' },
];

export const LeaderboardModal: React.FC<Props> = ({
  playerProfile,
  initialGameId = 'kubera_feast',
  onClose,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(initialGameId);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_CAMPUS'>('ALL');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadScores = useCallback(async (gameId: string) => {
    console.log(`[9 LEADERBOARD QUERY] game_id=${gameId}`);
    setIsLoading(true);
    try {
      const data = await fetchGameLeaderboard(gameId);
      console.log(`[UI LB FETCH RESULT]`, data);
      console.log(`[UI LB RESULT COUNT] ${data ? data.length : 0}`);
      setEntries((prev) => {
        console.log(`[UI LB STATE BEFORE]`, prev);
        console.log(`[UI LB STATE AFTER]`, data);
        return data;
      });
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('[Leaderboard] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialGameId) {
      setSelectedGameId(initialGameId);
    }
  }, [initialGameId]);

  useEffect(() => {
    loadScores(selectedGameId);
  }, [selectedGameId, loadScores]);

  const handleGameSelect = (gameId: string) => {
    soundEngine.playClick();
    setSelectedGameId(gameId);
  };

  const handleTabSelect = (tab: 'ALL' | 'MY_CAMPUS') => {
    soundEngine.playClick();
    setActiveTab(tab);
  };

  const handleRefresh = () => {
    soundEngine.playClick();
    loadScores(selectedGameId);
  };

  // Filter entries according to active tab
  const playerNormCollege = playerProfile?.college_normalized || (playerProfile?.college ? normalizeCollege(playerProfile.college) : '');

  const filteredEntries = activeTab === 'ALL'
    ? entries
    : entries.filter((e) => {
        if (!playerNormCollege) return true;
        const entryNorm = e.collegeNormalized || normalizeCollege(e.college);
        return entryNorm === playerNormCollege;
      });

  const activeGame = GAMES.find((g) => g.id === selectedGameId) || GAMES[0];

  console.log(`[UI LB RENDER] game=${selectedGameId} count=${filteredEntries.length}`);
  console.log(`[UI LB EMPTY CHECK] ${filteredEntries.length === 0}`);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-3xl max-h-[94vh] flex flex-col bg-gradient-to-b from-[#3E3028] via-[#2A1F1A] to-[#1E1410] border-2 border-[#C6A15B] rounded-3xl shadow-[0_0_50px_rgba(198,161,91,0.35)] overflow-hidden text-stone-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#C6A15B]/30 bg-black/30">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">🏆</span>
            <div>
              <h2 className="text-lg sm:text-xl font-cinzel font-black text-[#E8C766] tracking-wider uppercase">
                CAMPUS LEADERBOARD
              </h2>
              {playerProfile && (
                <p className="text-[11px] sm:text-xs font-outfit text-[#F6EBD8]/75 truncate max-w-xs sm:max-w-md">
                  Devotee: <span className="text-[#E8C766] font-semibold">{playerProfile.name}</span> • 🎓 <span className="text-[#F6EBD8] font-semibold">{playerProfile.college}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh Leaderboard"
              className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-[#C6A15B]/40 hover:bg-[#C6A15B]/20 text-[#E8C766] text-xs font-outfit font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span className={`text-sm ${isLoading ? 'animate-spin' : ''}`}>🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[#7A2E2E]/60 border border-[#C6A15B]/60 text-[#F6EBD8] hover:bg-[#7A2E2E] text-sm flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Game Selector Tabs (5 games) */}
        <div className="px-3 sm:px-6 pt-2.5 pb-2 bg-black/20 border-b border-[#C6A15B]/20 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            {GAMES.map((game) => {
              const isSelected = game.id === selectedGameId;
              return (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className={`px-3 py-1.5 rounded-xl font-cinzel text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C98232] via-[#E8C766] to-[#C98232] text-[#3E3028] shadow-[0_0_12px_rgba(232,199,102,0.5)] scale-102'
                      : 'bg-black/40 border border-[#C6A15B]/30 hover:bg-[#C6A15B]/15 text-[#F6EBD8]/90'
                  }`}
                >
                  <span className="text-sm">{game.icon}</span>
                  <span className="whitespace-nowrap">{game.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campus Filter Segmented Control: [ ALL CAMPUSES ] vs [ MY CAMPUS ] */}
        <div className="px-3 sm:px-6 py-2 bg-black/10 flex items-center justify-between gap-2 border-b border-[#C6A15B]/20">
          <div className="inline-flex p-1 bg-black/50 border border-[#C6A15B]/40 rounded-xl">
            <button
              onClick={() => handleTabSelect('ALL')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#C6A15B] text-[#3E3028] shadow-sm'
                  : 'text-[#F6EBD8]/70 hover:text-[#F6EBD8]'
              }`}
            >
              🌐 ALL CAMPUSES
            </button>
            <button
              onClick={() => handleTabSelect('MY_CAMPUS')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all cursor-pointer ${
                activeTab === 'MY_CAMPUS'
                  ? 'bg-[#C6A15B] text-[#3E3028] shadow-sm'
                  : 'text-[#F6EBD8]/70 hover:text-[#F6EBD8]'
              }`}
            >
              🎓 MY CAMPUS {playerProfile?.college ? `(${playerProfile.college})` : ''}
            </button>
          </div>

          <span className="text-[11px] text-[#F6EBD8]/60 font-outfit hidden sm:block">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'Score' : 'Scores'} Recorded
          </span>
        </div>

        {/* Leaderboard Table Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-[180px] max-h-[50vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-stone-400 font-outfit text-sm">
              <span className="text-3xl animate-spin mb-2">🪔</span>
              <span>Fetching live rankings from Supabase...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#7A2E2E]/40 border border-[#C6A15B]/40 flex items-center justify-center text-2xl mb-2">
                {activeGame.icon}
              </div>
              <h3 className="text-sm sm:text-base font-cinzel font-bold text-[#E8C766]">
                {activeTab === 'MY_CAMPUS'
                  ? `No scores recorded yet for ${playerProfile?.college || 'your campus'} in ${activeGame.title}!`
                  : `No scores recorded yet in ${activeGame.title}!`}
              </h3>
              <p className="text-xs text-[#F6EBD8]/75 font-outfit max-w-sm mt-1">
                Play {activeGame.title} and your score will be in the top rankings!
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#C6A15B]/40 text-[11px] sm:text-xs font-cinzel font-bold text-[#C6A15B] uppercase tracking-wider">
                    <th className="py-2 px-2.5 sm:px-3 text-center w-14">Rank</th>
                    <th className="py-2 px-2.5 sm:px-3">Player Name</th>
                    <th className="py-2 px-2.5 sm:px-3">College / Campus</th>
                    <th className="py-2 px-2.5 sm:px-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C6A15B]/15 text-xs sm:text-sm font-outfit">
                  {filteredEntries.map((entry, idx) => {
                    const rank = idx + 1;
                    const isCurrentPlayer = playerProfile && (
                      String(entry.playerId) === String(playerProfile.id) ||
                      (entry.playerName.toLowerCase() === playerProfile.name.toLowerCase() &&
                       (entry.collegeNormalized === playerProfile.college_normalized ||
                        normalizeCollege(entry.college) === playerProfile.college_normalized))
                    );

                    let medalBadge: React.ReactNode = null;
                    if (rank === 1) medalBadge = <span className="text-base sm:text-lg">🥇</span>;
                    else if (rank === 2) medalBadge = <span className="text-base sm:text-lg">🥈</span>;
                    else if (rank === 3) medalBadge = <span className="text-base sm:text-lg">🥉</span>;
                    else medalBadge = <span className="font-bold text-[#C6A15B]/80 font-mono">#{rank}</span>;

                    return (
                      <tr
                        key={entry.id || idx}
                        className={`transition-colors ${
                          isCurrentPlayer
                            ? 'bg-[#E8C766]/15 border-l-4 border-l-[#E8C766]'
                            : 'hover:bg-black/25'
                        }`}
                      >
                        <td className="py-2.5 px-2.5 sm:px-3 text-center">
                          <div className="flex items-center justify-center">
                            {medalBadge}
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 sm:px-3 font-semibold text-[#F6EBD8]">
                          <div className="flex items-center gap-1.5">
                            <span>{entry.playerName}</span>
                            {isCurrentPlayer && (
                              <span className="text-[10px] font-cinzel font-bold px-1.5 py-0.2 rounded bg-[#C6A15B] text-[#3E3028] shadow-xs">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 sm:px-3 text-[#F6EBD8]/80 text-xs truncate max-w-[140px] sm:max-w-none">
                          {entry.college}
                        </td>
                        <td className="py-2.5 px-2.5 sm:px-3 text-right font-black text-sm sm:text-base font-outfit text-[#E8C766]">
                          {entry.score.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-[#C6A15B]/30 bg-black/40 flex items-center justify-between text-[11px] font-outfit text-[#F6EBD8]/70">
          <span>🎮 Scores sync directly with Supabase</span>
          <span>Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};
