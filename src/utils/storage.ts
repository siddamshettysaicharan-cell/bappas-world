/**
 * LocalStorage state manager for Ganesha — Stories of Wisdom
 * Strictly local, no fake online scores or external telemetry.
 */

import { ChapterId, GameSaveData } from '../types';

const STORAGE_KEY = 'ganesha_stories_of_wisdom_save_v1';

const defaultSaveData: GameSaveData = {
  highScores: {
    kubera_feast: 0,
    unstoppable_scribe: 0,
    great_race: 0,
    the_gatekeeper: 0,
    mushaks_adventure: 0,
  },
  totalScore: 0,
  chaptersCompleted: {
    kubera_feast: false,
    unstoppable_scribe: false,
    great_race: false,
    the_gatekeeper: false,
    mushaks_adventure: false,
  },
  volumeMuted: false,
};

export class GameStorage {
  public static load(): GameSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSaveData;
      const parsed = JSON.parse(raw);
      return {
        ...defaultSaveData,
        ...parsed,
        highScores: { ...defaultSaveData.highScores, ...(parsed.highScores || {}) },
        chaptersCompleted: { ...defaultSaveData.chaptersCompleted, ...(parsed.chaptersCompleted || {}) },
      };
    } catch {
      return defaultSaveData;
    }
  }

  public static save(data: GameSaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  public static getHighScore(chapterId: ChapterId): number {
    const data = this.load();
    return data.highScores[chapterId] || 0;
  }

  public static recordChapterScore(chapterId: ChapterId, score: number): { isNewBest: boolean; previousBest: number } {
    const data = this.load();
    const prev = data.highScores[chapterId] || 0;
    const isNew = score > prev;
    if (isNew) {
      data.highScores[chapterId] = score;
    }
    if (score >= 50) {
      data.chaptersCompleted[chapterId] = true;
    }
    data.totalScore = Object.values(data.highScores).reduce((acc, curr) => acc + curr, 0);
    this.save(data);
    return { isNewBest: isNew, previousBest: prev };
  }

  public static isChapterCompleted(chapterId: ChapterId): boolean {
    const data = this.load();
    return !!data.chaptersCompleted[chapterId];
  }
}
