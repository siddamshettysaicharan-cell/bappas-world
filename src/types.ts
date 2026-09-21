/**
 * Game Type Definitions for Ganesha — Stories of Wisdom
 */

export type GameScene = 
  | 'CINEMATIC_INTRO'
  | 'MAIN_MENU'
  | 'GANESHA_WORLD'
  | 'STORY_INTRO'
  | 'KUBERA_FEAST'
  | 'SCRIBE_CHAPTER'
  | 'GREAT_RACE'
  | 'MUSHIKA_RUN'
  | 'BAPPA_MATCH'
  | 'CHAPTER_RESULT';

export type ChapterId = 
  | 'kubera_feast'
  | 'unstoppable_scribe'
  | 'great_race'
  | 'the_gatekeeper'
  | 'mushaks_adventure';

export interface ChapterMeta {
  id: ChapterId;
  title: string;
  subtitle: string;
  locationName: string;
  icon: string;
  storyParchment: {
    moral: string;
    narrative: string;
    instructions: string[];
    tips: string;
  };
  unlocked: boolean;
  highScore: number;
  timesPlayed: number;
}

export type ItemCategory = 'food' | 'distraction';

export interface FeastItemType {
  id: string;
  name: string;
  category: ItemCategory;
  points: number; // +10 for food, 0 for distraction
  color: string;
  secondaryColor: string;
  description: string;
}

export interface FallingFeastItem {
  id: number;
  type: FeastItemType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  size: number;
  collected: boolean;
  alpha: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  text?: string;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface PlayerAvatar {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  size: number;
  facing: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  stepCycle: number;
}

export interface WorldLandmark {
  id: ChapterId;
  name: string;
  subtitle: string;
  icon: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  bannerText: string;
}

export interface FeastGameResult {
  chapterId: ChapterId;
  score: number;
  foodCollected: number;
  bestCombo: number;
  timeSurvivedSeconds: number;
  isNewBest: boolean;
  previousBest: number;
  wpm?: number;
  accuracy?: number;
  completed?: boolean;
  reason?: 'time_up' | 'completed' | 'stopped';
  manuscriptProgress?: number;
  modaksCollected?: number;
  totalModaks?: number;
}

export interface GameSaveData {
  highScores: Record<string, number>;
  totalScore: number;
  chaptersCompleted: Record<string, boolean>;
  volumeMuted: boolean;
}

export interface PlayerProfile {
  id: string | number;
  name: string;
  college: string;
  college_normalized: string;
  created_at?: string;
}

export interface LeaderboardEntry {
  id: string | number;
  playerId: string | number | null;
  playerName: string;
  college: string;
  collegeNormalized: string;
  gameId: string;
  score: number;
  createdAt?: string;
  rank?: number;
}
