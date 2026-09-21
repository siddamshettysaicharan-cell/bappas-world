/**
 * BAPPA MATCH — Sacred Gate Memory Matching Mini-Game
 * A polished, festive Ganesh Chaturthi memory game celebrating Ganesha's wisdom.
 *
 * Features:
 * - 3 Progressive Levels:
 *    Level 1 = 4 pairs (8 cards, 30s)
 *    Level 2 = 6 pairs (12 cards, 35s)
 *    Level 3 = 8 pairs (16 cards, 40s)
 * - 8 Ganesh Chaturthi Themed Pairs:
 *    Ganesha, Mushika, Modak, Diya, Lotus, Marigold, Rangoli, Ganesh Crown
 * - Animated Card Flips with 3D perspective easing
 * - Real-time working countdown timer with urgency (visual pulse + ticks in final 5s)
 * - Interactive Little Ganesha Companion reacting to matches and mismatches
 * - One-line Wisdom facts cycling during gameplay
 * - "Why This Game?" Ganesha & Kartikeya wisdom lore popup
 * - "Wisdom Unlocked!" festive completion celebration
 * - Time's Up screen with Try Again & Return to World
 * - Desktop & mobile touch responsive design
 */

import { soundEngine } from '../../audio/soundEngine';
import { FeastGameResult, Particle } from '../../types';
import { GameStorage } from '../../utils/storage';

export interface BappaCardType {
  key: string;
  name: string;
  color: string;
  secondaryColor: string;
  symbol: string;
}

export const BAPPA_PAIRS: BappaCardType[] = [
  { key: 'ganesha', name: 'Lord Ganesha', color: '#f59e0b', secondaryColor: '#fbbf24', symbol: '🐘' },
  { key: 'mushika', name: 'Mushika Vahana', color: '#94a3b8', secondaryColor: '#cbd5e1', symbol: '🐭' },
  { key: 'modak', name: 'Sacred Modak', color: '#f97316', secondaryColor: '#fdba74', symbol: '🥟' },
  { key: 'diya', name: 'Festive Diya', color: '#eab308', secondaryColor: '#fef08a', symbol: '🪔' },
  { key: 'lotus', name: 'Divine Lotus', color: '#ec4899', secondaryColor: '#f472b6', symbol: '🪷' },
  { key: 'marigold', name: 'Marigold Garland', color: '#ea580c', secondaryColor: '#fb923c', symbol: '🌼' },
  { key: 'rangoli', name: 'Sacred Rangoli', color: '#8b5cf6', secondaryColor: '#c084fc', symbol: '🌸' },
  { key: 'crown', name: 'Ganesh Mukut', color: '#e11d48', secondaryColor: '#f43f5e', symbol: '👑' },
];

export const WISDOM_FACTS: string[] = [
  "Mushika is Ganesha's devoted vehicle.",
  "Modak is Lord Ganesha's favourite sweet offering.",
  "Ganesha used his wisdom to circle his parents as his world.",
  "Marigolds and red flowers are sacred to Bappa.",
  "Ganesha is known as Vighnaharta — Remover of Obstacles.",
  "The single broken tusk represents supreme dedication and focus.",
  "Lord Ganesha is worshipped first before any new beginning."
];

export interface CardState {
  id: number;
  type: BappaCardType;
  isFlipped: boolean;
  isMatched: boolean;
  flipProgress: number; // 0 (back) to 1 (face)
  targetFlip: number;
  matchSparkle: number;
  // Bounding rect on screen
  x: number;
  y: number;
  w: number;
  h: number;
}

export class BappaMatchScene {
  // Game Modes
  public mode: 'START' | 'PLAYING' | 'TIME_UP' | 'LEVEL_TRANSITION' | 'CELEBRATION' | 'COMPLETED' = 'START';
  public showWhyModal: boolean = false;

  // Level & Progression
  public currentLevel: number = 1; // 1, 2, 3
  public maxLevels: number = 3;
  public levelTimeLimits: number[] = [30, 35, 40];
  public timer: number = 30;
  public totalTimeTaken: number = 0;

  // Scoring & Stats
  public score: number = 0;
  public matchesCount: number = 0;
  public totalPairsMatched: number = 0;
  public currentStreak: number = 0;
  public bestStreak: number = 0;

  // Cards
  public cards: CardState[] = [];
  public flippedCardIds: number[] = [];
  public isProcessingMatch: boolean = false;
  private mismatchTimer: number = 0;

  // Urgency Timer Audio
  private lastTickedSecond: number = -1;

  // Ganesha Companion State
  public ganeshaReaction: 'IDLE' | 'HAPPY' | 'PLAYFUL' = 'IDLE';
  public ganeshaReactionTimer: number = 0;
  public ganeshaHopY: number = 0;
  public activeFactIndex: number = 0;
  public factTimer: number = 0;

  // Visual Effects & Particles
  private particles: Particle[] = [];
  private celebrationTimer: number = 0;
  private levelTransitionTimer: number = 0;
  private globalAnimTime: number = 0;

  // UI Interactive Buttons Bounding Boxes
  private startBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private whyBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private closeWhyBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private tryAgainBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private returnBtnRect = { x: 0, y: 0, w: 0, h: 0 };
  private playAgainBtnRect = { x: 0, y: 0, w: 0, h: 0 };

  // Callbacks
  private onGameOver: (result: FeastGameResult) => void;
  private onReturnToWorld: () => void;
  private hasTriggeredGameOver: boolean = false;

  constructor(
    onGameOver: (result: FeastGameResult) => void,
    onReturnToWorld: () => void
  ) {
    this.onGameOver = onGameOver;
    this.onReturnToWorld = onReturnToWorld;
    this.reset();
  }

  public reset() {
    this.mode = 'START';
    this.hasTriggeredGameOver = false;
    this.showWhyModal = false;
    this.currentLevel = 1;
    this.score = 0;
    this.matchesCount = 0;
    this.totalPairsMatched = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.totalTimeTaken = 0;
    this.timer = this.levelTimeLimits[0];
    this.lastTickedSecond = -1;
    this.isProcessingMatch = false;
    this.flippedCardIds = [];
    this.ganeshaReaction = 'IDLE';
    this.ganeshaReactionTimer = 0;
    this.ganeshaHopY = 0;
    this.activeFactIndex = 0;
    this.factTimer = 0;
    this.particles = [];
  }

  // Start Level with shuffled pairs
  public startLevel(level: number) {
    this.currentLevel = level;
    this.timer = this.levelTimeLimits[level - 1] || 30;
    this.lastTickedSecond = -1;
    this.matchesCount = 0;
    this.flippedCardIds = [];
    this.isProcessingMatch = false;
    this.mismatchTimer = 0;
    this.mode = 'PLAYING';
    this.ganeshaReaction = 'IDLE';
    this.ganeshaReactionTimer = 0;

    // Number of pairs for this level: Level 1=4, Level 2=6, Level 3=8
    const pairCounts = [4, 6, 8];
    const numPairs = pairCounts[level - 1] || 4;

    // Pick unique pairs from BAPPA_PAIRS
    const selectedTypes = [...BAPPA_PAIRS].slice(0, numPairs);

    // Create 2 of each
    const deck: BappaCardType[] = [];
    selectedTypes.forEach((t) => {
      deck.push(t);
      deck.push(t);
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Build card states
    this.cards = deck.map((type, idx) => ({
      id: idx,
      type,
      isFlipped: false,
      isMatched: false,
      flipProgress: 0,
      targetFlip: 0,
      matchSparkle: 0,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    }));

    // Spawn gentle start celebration sparkles
    this.spawnFestivePetals(15);
  }

  public cleanUp() {
    this.particles = [];
  }

  // Main Update Loop
  public update(dt: number, width: number, height: number) {
    this.globalAnimTime += dt;

    // Animate Card Flips smoothly
    this.cards.forEach((card) => {
      if (card.flipProgress !== card.targetFlip) {
        const step = dt * 6.5;
        if (card.flipProgress < card.targetFlip) {
          card.flipProgress = Math.min(card.targetFlip, card.flipProgress + step);
        } else {
          card.flipProgress = Math.max(card.targetFlip, card.flipProgress - step);
        }
      }
      if (card.matchSparkle > 0) {
        card.matchSparkle = Math.max(0, card.matchSparkle - dt * 2.5);
      }
    });

    // Mismatch flip-back delay timer
    if (this.mismatchTimer > 0) {
      this.mismatchTimer -= dt;
      if (this.mismatchTimer <= 0) {
        // Flip back the 2 cards
        this.flippedCardIds.forEach((id) => {
          const card = this.cards.find((c) => c.id === id);
          if (card && !card.isMatched) {
            card.isFlipped = false;
            card.targetFlip = 0;
          }
        });
        this.flippedCardIds = [];
        this.isProcessingMatch = false;
      }
    }

    // Ganesha Reactions & Animation
    if (this.ganeshaReactionTimer > 0) {
      this.ganeshaReactionTimer -= dt;
      if (this.ganeshaReaction === 'HAPPY') {
        this.ganeshaHopY = Math.abs(Math.sin(this.globalAnimTime * 12)) * 14;
      } else if (this.ganeshaReaction === 'PLAYFUL') {
        this.ganeshaHopY = Math.sin(this.globalAnimTime * 8) * 4;
      }
      if (this.ganeshaReactionTimer <= 0) {
        this.ganeshaReaction = 'IDLE';
        this.ganeshaHopY = 0;
      }
    } else {
      this.ganeshaHopY = Math.sin(this.globalAnimTime * 2.5) * 2.5;
    }

    // Facts cycling timer
    this.factTimer += dt;
    if (this.factTimer > 7.0) {
      this.factTimer = 0;
      this.activeFactIndex = (this.activeFactIndex + 1) % WISDOM_FACTS.length;
    }

    // Playing Mode: Count down timer & urgency checks
    if (this.mode === 'PLAYING') {
      this.timer -= dt;
      this.totalTimeTaken += dt;

      // Final 5 seconds urgency audio tick
      if (this.timer <= 5.0 && this.timer > 0) {
        const currentSecond = Math.ceil(this.timer);
        if (currentSecond !== this.lastTickedSecond) {
          this.lastTickedSecond = currentSecond;
          soundEngine.playUrgentTick(currentSecond);
        }
      }

      // Time's Up condition
      if (this.timer <= 0 && !this.hasTriggeredGameOver) {
        console.log('[GAME OVER] the_gatekeeper', { score: this.score });
        this.hasTriggeredGameOver = true;
        this.timer = 0;
        this.mode = 'TIME_UP';
        soundEngine.playGameOver();

        const { isNewBest, previousBest } = GameStorage.recordChapterScore('the_gatekeeper', this.score);
        const result: FeastGameResult = {
          chapterId: 'the_gatekeeper',
          score: this.score,
          foodCollected: this.totalPairsMatched,
          bestCombo: this.bestStreak,
          timeSurvivedSeconds: Math.floor(this.totalTimeTaken),
          isNewBest,
          previousBest,
        };
        console.log('[CALLBACK] the_gatekeeper', result);
        this.onGameOver(result);
      }
    }

    // Level Transition Delay
    if (this.mode === 'LEVEL_TRANSITION') {
      this.levelTransitionTimer -= dt;
      if (this.levelTransitionTimer <= 0) {
        if (this.currentLevel < this.maxLevels) {
          this.startLevel(this.currentLevel + 1);
        } else {
          this.triggerWisdomUnlocked();
        }
      }
    }

    // Celebration sequence
    if (this.mode === 'CELEBRATION') {
      this.celebrationTimer -= dt;
      if (Math.random() < 0.3) {
        this.spawnCelebrationBurst(
          width * (0.2 + Math.random() * 0.6),
          height * (0.2 + Math.random() * 0.5)
        );
      }
      if (this.celebrationTimer <= 0 && !this.hasTriggeredGameOver) {
        console.log('[GAME OVER] the_gatekeeper', { score: this.score });
        this.hasTriggeredGameOver = true;
        this.mode = 'COMPLETED';
        const { isNewBest, previousBest } = GameStorage.recordChapterScore('the_gatekeeper', this.score);
        const result: FeastGameResult = {
          chapterId: 'the_gatekeeper',
          score: this.score,
          foodCollected: this.totalPairsMatched,
          bestCombo: this.bestStreak,
          timeSurvivedSeconds: Math.floor(this.totalTimeTaken),
          isNewBest,
          previousBest,
        };
        console.log('[CALLBACK] the_gatekeeper', result);
        this.onGameOver(result);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // slight gravity
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Handle Card Click / Tap
  public handleCardClick(index: number) {
    if (this.mode !== 'PLAYING' || this.isProcessingMatch) return;

    const card = this.cards[index];
    if (!card || card.isMatched || card.isFlipped) return;

    // Flip card
    card.isFlipped = true;
    card.targetFlip = 1;
    soundEngine.playCardFlip();
    this.flippedCardIds.push(card.id);

    // If 2 cards are now open, compare them
    if (this.flippedCardIds.length === 2) {
      this.isProcessingMatch = true;
      const card1 = this.cards.find((c) => c.id === this.flippedCardIds[0]);
      const card2 = this.cards.find((c) => c.id === this.flippedCardIds[1]);

      if (card1 && card2) {
        if (card1.type.key === card2.type.key) {
          // MATCH!
          this.handleMatchSuccess(card1, card2);
        } else {
          // MISMATCH!
          this.handleMismatch(card1, card2);
        }
      }
    }
  }

  // Success Match handler
  private handleMatchSuccess(card1: CardState, card2: CardState) {
    card1.isMatched = true;
    card2.isMatched = true;
    card1.matchSparkle = 1.0;
    card2.matchSparkle = 1.0;

    this.currentStreak++;
    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
    }

    // Points calculation: Base 120 + Time Bonus + Streak Multiplier
    const timeBonus = Math.floor(this.timer * 4);
    const streakBonus = (this.currentStreak - 1) * 50;
    const earnedPoints = 120 + timeBonus + streakBonus;
    this.score += earnedPoints;

    this.matchesCount++;
    this.totalPairsMatched++;

    // Audio & Reactions
    soundEngine.playCardMatch(this.currentStreak);
    this.ganeshaReaction = 'HAPPY';
    this.ganeshaReactionTimer = 1.8;

    // Spawn celebratory petals around both matched cards
    this.spawnCardMatchSparkles(card1.x + card1.w / 2, card1.y + card1.h / 2);
    this.spawnCardMatchSparkles(card2.x + card2.w / 2, card2.y + card2.h / 2);

    // Reset flipped buffer immediately
    this.flippedCardIds = [];
    this.isProcessingMatch = false;

    // Check if level is completed
    const requiredPairs = [4, 6, 8][this.currentLevel - 1] || 4;
    if (this.matchesCount >= requiredPairs) {
      // Level completed!
      this.mode = 'LEVEL_TRANSITION';
      this.levelTransitionTimer = 1.4;
      soundEngine.playComboStreak(this.currentLevel);
      this.spawnFestivePetals(25);
    }
  }

  // Mismatch handler
  private handleMismatch(card1: CardState, card2: CardState) {
    this.currentStreak = 0;
    soundEngine.playCardMismatch();
    this.ganeshaReaction = 'PLAYFUL';
    this.ganeshaReactionTimer = 1.4;

    // Wait 0.8s so user can memorize the two wrong cards
    this.mismatchTimer = 0.8;
  }

  // Trigger Wisdom Unlocked Celebration after Level 3
  private triggerWisdomUnlocked() {
    this.mode = 'CELEBRATION';
    this.celebrationTimer = 2.4;
    soundEngine.playWisdomUnlocked();
  }

  // Pointer Down / Click routing
  public handlePointerDown(clientX: number, clientY: number, width: number, height: number) {
    // If Why Popup is open
    if (this.showWhyModal) {
      if (this.isInsideRect(clientX, clientY, this.closeWhyBtnRect)) {
        soundEngine.playClick();
        this.showWhyModal = false;
      }
      return;
    }

    // START SCREEN BUTTONS
    if (this.mode === 'START') {
      if (this.isInsideRect(clientX, clientY, this.startBtnRect)) {
        soundEngine.playClick();
        this.startLevel(1);
        return;
      }
      if (this.isInsideRect(clientX, clientY, this.whyBtnRect)) {
        soundEngine.playClick();
        this.showWhyModal = true;
        return;
      }
      return;
    }

    // PLAYING MODE: Check Card Clicks
    if (this.mode === 'PLAYING') {
      for (let i = 0; i < this.cards.length; i++) {
        const card = this.cards[i];
        if (this.isInsideRect(clientX, clientY, card)) {
          this.handleCardClick(i);
          return;
        }
      }
      return;
    }

    // TIME_UP MODE BUTTONS
    if (this.mode === 'TIME_UP') {
      if (this.isInsideRect(clientX, clientY, this.tryAgainBtnRect)) {
        soundEngine.playClick();
        this.startLevel(this.currentLevel);
        return;
      }
      if (this.isInsideRect(clientX, clientY, this.returnBtnRect)) {
        soundEngine.playClick();
        this.onReturnToWorld();
        return;
      }
      return;
    }

    // COMPLETED MODE BUTTONS
    if (this.mode === 'COMPLETED') {
      if (this.isInsideRect(clientX, clientY, this.playAgainBtnRect)) {
        soundEngine.playClick();
        this.reset();
        this.startLevel(1);
        return;
      }
      if (this.isInsideRect(clientX, clientY, this.returnBtnRect)) {
        soundEngine.playClick();
        this.onReturnToWorld();
        return;
      }
      return;
    }
  }

  private isInsideRect(x: number, y: number, r: { x: number; y: number; w: number; h: number }): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  // Particle Spawners
  private spawnFestivePetals(count: number) {
    const colors = ['#f59e0b', '#fbbf24', '#ec4899', '#f97316', '#fb7185', '#fbbf24'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 2.5,
        life: 0,
        maxLife: 3 + Math.random() * 2,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }

  private spawnCardMatchSparkles(x: number, y: number) {
    const colors = ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff', '#ec4899'];
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.2;
      const speed = 2.5 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.5,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }

  private spawnCelebrationBurst(x: number, y: number) {
    const colors = ['#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#fbbf24', '#ffffff'];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }

  // ==========================================
  // RENDER PIPELINE
  // ==========================================
  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // 1. Festive Temple Background with Diyas & Marigold Torans
    this.renderBackground(ctx, width, height);

    // 2. Render depending on active mode
    if (this.mode === 'START') {
      this.renderStartScreen(ctx, width, height);
    } else if (this.mode === 'PLAYING' || this.mode === 'LEVEL_TRANSITION') {
      this.renderGameField(ctx, width, height);
    } else if (this.mode === 'TIME_UP') {
      this.renderGameField(ctx, width, height);
      this.renderTimeUpOverlay(ctx, width, height);
    } else if (this.mode === 'CELEBRATION') {
      this.renderGameField(ctx, width, height);
      this.renderCelebrationFlash(ctx, width, height);
    } else if (this.mode === 'COMPLETED') {
      this.renderCompletedScreen(ctx, width, height);
    }

    // 3. Render Particles
    this.renderParticles(ctx);

    // 4. Render "Why This Game" modal popover if open
    if (this.showWhyModal) {
      this.renderWhyModal(ctx, width, height);
    }
  }

  // 1. Background Renderer
  private renderBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Luxurious dark temple sanctum gradient
    const grad = ctx.createRadialGradient(
      width / 2, height * 0.4, 40,
      width / 2, height / 2, Math.max(width, height) * 0.85
    );
    grad.addColorStop(0, '#361507');
    grad.addColorStop(0.5, '#1e0a03');
    grad.addColorStop(1, '#0c0402');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Mandap Pillars on edges
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Subtle golden corner flourishes
    this.drawCornerFlourish(ctx, 24, 24, 1, 1);
    this.drawCornerFlourish(ctx, width - 24, 24, -1, 1);
    this.drawCornerFlourish(ctx, 24, height - 24, 1, -1);
    this.drawCornerFlourish(ctx, width - 24, height - 24, -1, -1);

    // Floating festive lamps/diyas on bottom left and right
    this.drawFestiveDiya(ctx, 40, height - 40, 1.2);
    this.drawFestiveDiya(ctx, width - 40, height - 40, 1.2);
  }

  private drawCornerFlourish(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(0, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(8, 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawFestiveDiya(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Glow aura
    const flicker = Math.sin(this.globalAnimTime * 8 + x) * 2;
    const flameGrad = ctx.createRadialGradient(0, -12, 2, 0, -12, 22 + flicker);
    flameGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    flameGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(0, -12, 22 + flicker, 0, Math.PI * 2);
    ctx.fill();

    // Clay Base
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Burning Flame
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(0, -18 + flicker * 0.5, 0, -20 + flicker);
    ctx.quadraticCurveTo(0, -18 + flicker * 0.5, 4, -2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 2. Start Screen
  private renderStartScreen(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const isMobile = width < 640;
    const centerX = width / 2;

    // Ganesha sitting majestically atop
    const ganeshaY = height * 0.24;
    this.renderGaneshaCharacter(ctx, centerX, ganeshaY, isMobile ? 1.7 : 2.3);

    // Title: BAPPA MATCH
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `900 ${isMobile ? 32 : 44}px 'Cinzel', serif`;
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillText('BAPPA MATCH', centerX, height * 0.48);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = `600 ${isMobile ? 14 : 17}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Match the pairs. Test your memory!', centerX, height * 0.54);

    // Instruction Box
    const boxW = Math.min(width * 0.88, 460);
    const boxH = 46;
    const boxY = height * 0.62;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(centerX - boxW / 2, boxY - boxH / 2, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = `600 ${isMobile ? 13 : 15}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#fde68a';
    ctx.fillText('Flip 2  →  Find the pair  →  Match them all!', centerX, boxY);

    // Buttons: START GAME & WHY THIS GAME
    const btnW = Math.min(boxW, 300);
    const btnH = 50;

    // 1. START GAME Button
    const startY = height * 0.74;
    this.startBtnRect = { x: centerX - btnW / 2, y: startY - btnH / 2, w: btnW, h: btnH };

    const startGrad = ctx.createLinearGradient(centerX - btnW / 2, 0, centerX + btnW / 2, 0);
    startGrad.addColorStop(0, '#f59e0b');
    startGrad.addColorStop(0.5, '#fbbf24');
    startGrad.addColorStop(1, '#f59e0b');

    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = startGrad;
    ctx.beginPath();
    ctx.roundRect(this.startBtnRect.x, this.startBtnRect.y, btnW, btnH, 16);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = `900 ${isMobile ? 16 : 18}px 'Cinzel', serif`;
    ctx.fillStyle = '#1c0a02';
    ctx.fillText('START GAME ▶', centerX, startY);

    // 2. WHY THIS GAME Button
    const whyY = height * 0.84;
    const whyW = Math.min(boxW, 220);
    const whyH = 40;
    this.whyBtnRect = { x: centerX - whyW / 2, y: whyY - whyH / 2, w: whyW, h: whyH };

    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(this.whyBtnRect.x, this.whyBtnRect.y, whyW, whyH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = `700 ${isMobile ? 12 : 13}px 'Cinzel', serif`;
    ctx.fillStyle = '#fde68a';
    ctx.fillText('📖 WHY THIS GAME', centerX, whyY);
  }

  // 3. In-Game Field (HUD, Companion Ganesha, Card Matrix)
  private renderGameField(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const isPortrait = height > width;
    const isMobile = width < 640;

    // HUD Top Bar
    this.renderHUD(ctx, width, height, isPortrait);

    // Compute Card Grid Layout
    this.layoutAndRenderCards(ctx, width, height, isPortrait);

    // Companion Ganesha & Speech Bubble
    this.renderCompanionArea(ctx, width, height, isPortrait, isMobile);

    // Urgent screen border glow during final 5 seconds
    if (this.timer <= 5.0 && this.timer > 0 && this.mode === 'PLAYING') {
      const pulse = (Math.sin(this.globalAnimTime * 12) + 1) * 0.5;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + pulse * 0.4})`;
      ctx.lineWidth = 6 + pulse * 6;
      ctx.strokeRect(4, 4, width - 8, height - 8);
    }
  }

  // Top HUD Bar (Level, Score, Matches, Time)
  private renderHUD(ctx: CanvasRenderingContext2D, width: number, height: number, isPortrait: boolean) {
    const topY = 22;
    const hudW = Math.min(width * 0.94, 760);
    const hudX = (width - hudW) / 2;
    const hudH = 50;

    // HUD Background Capsule
    ctx.fillStyle = 'rgba(15, 6, 3, 0.85)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hudX, topY, hudW, hudH, 25);
    ctx.fill();
    ctx.stroke();

    const colW = hudW / 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Level
    const c1X = hudX + colW * 0.5;
    ctx.font = "600 10px 'Outfit', sans-serif";
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('LEVEL', c1X, topY + 16);
    ctx.font = "800 15px 'Cinzel', serif";
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.currentLevel} / ${this.maxLevels}`, c1X, topY + 34);

    // 2. Score
    const c2X = hudX + colW * 1.5;
    ctx.font = "600 10px 'Outfit', sans-serif";
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('SCORE', c2X, topY + 16);
    ctx.font = "800 15px 'Cinzel', serif";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${this.score}`, c2X, topY + 34);

    // 3. Matches
    const requiredPairs = [4, 6, 8][this.currentLevel - 1] || 4;
    const c3X = hudX + colW * 2.5;
    ctx.font = "600 10px 'Outfit', sans-serif";
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('MATCHES', c3X, topY + 16);
    ctx.font = "800 15px 'Cinzel', serif";
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.matchesCount} / ${requiredPairs}`, c3X, topY + 34);

    // 4. Time (Urgent Pulse during final 5s)
    const c4X = hudX + colW * 3.5;
    const isUrgent = this.timer <= 5.0 && this.timer > 0;
    const timeColor = isUrgent ? '#ef4444' : '#fef08a';

    ctx.font = "600 10px 'Outfit', sans-serif";
    ctx.fillStyle = isUrgent ? '#f87171' : '#f59e0b';
    ctx.fillText('TIME', c4X, topY + 16);

    const timeScale = isUrgent ? 1 + Math.sin(this.globalAnimTime * 14) * 0.15 : 1.0;
    ctx.save();
    ctx.translate(c4X, topY + 34);
    ctx.scale(timeScale, timeScale);
    ctx.font = `900 ${isUrgent ? 17 : 16}px 'Cinzel', serif`;
    ctx.fillStyle = timeColor;
    ctx.fillText(`${Math.ceil(this.timer)}s`, 0, 0);
    ctx.restore();
  }

  // Companion Ganesha Area
  private renderCompanionArea(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPortrait: boolean,
    isMobile: boolean
  ) {
    if (isPortrait) {
      // In portrait: Ganesha sits prominently on the upper-left flank below HUD
      const gX = Math.max(60, width * 0.20);
      const gY = 142;
      const scale = isMobile ? 1.3 : 1.45;
      this.renderGaneshaCharacter(ctx, gX, gY, scale);

      // Fact Speech Bubble positioned beside Ganesha without overlap
      const bubbleX = gX + 54;
      const bubbleW = Math.max(160, width - bubbleX - 16);
      this.renderSpeechBubble(ctx, bubbleX, 114, bubbleW, 58, WISDOM_FACTS[this.activeFactIndex]);
    } else {
      // In landscape / desktop: Ganesha sits prominently in his dedicated left sanctuary
      const leftAreaW = Math.min(280, Math.max(180, width * 0.24));
      const gX = leftAreaW * 0.5;
      const gY = height * 0.42;
      const scale = Math.min(2.2, Math.max(1.65, width / 620));
      this.renderGaneshaCharacter(ctx, gX, gY, scale);

      // Speech bubble placed below Ganesha with generous readable padding
      const bubbleW = Math.min(240, leftAreaW - 20);
      const bubbleY = Math.min(height - 75, gY + 95);
      this.renderSpeechBubble(ctx, gX - bubbleW / 2, bubbleY, bubbleW, 58, WISDOM_FACTS[this.activeFactIndex]);
    }
  }

  // Draw Majestic Main Character Ganesha with high detail and responsive reactions
  private renderGaneshaCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.translate(x, y - this.ganeshaHopY);
    ctx.scale(scale, scale);

    // 1. Divine Prabhavali (Radiant Golden Halo)
    const haloPulse = 1 + Math.sin(this.globalAnimTime * 3) * 0.05;
    const auraRad = (38 + (this.ganeshaReaction === 'HAPPY' ? 14 : 0)) * haloPulse;
    const auraGrad = ctx.createRadialGradient(0, -14, 8, 0, -14, auraRad * 1.4);
    auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
    auraGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.45)');
    auraGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.18)');
    auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -14, auraRad * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Halo Golden Rim & Sunbeams
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -14, auraRad, 0, Math.PI * 2);
    ctx.stroke();

    for (let r = 0; r < 12; r++) {
      const ang = (r * Math.PI * 2) / 12 + this.globalAnimTime * 0.1;
      const rIn = auraRad * 1.02;
      const rOut = auraRad * (r % 2 === 0 ? 1.22 : 1.12);
      ctx.strokeStyle = r % 2 === 0 ? '#fef08a' : '#f59e0b';
      ctx.lineWidth = r % 2 === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * rIn, -14 + Math.sin(ang) * rIn);
      ctx.lineTo(Math.cos(ang) * rOut, -14 + Math.sin(ang) * rOut);
      ctx.stroke();
    }

    // 2. Lotus Throne Base (Peetha)
    ctx.fillStyle = '#e11d48';
    for (let l = 0; l < 7; l++) {
      const ang = Math.PI * 0.15 + (l * Math.PI * 0.7) / 6;
      const lx = Math.cos(ang) * 32;
      const ly = Math.sin(ang) * 16 + 22;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 10, 6, ang - Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Inner vibrant pink petals
    ctx.fillStyle = '#f43f5e';
    for (let l = 0; l < 7; l++) {
      const ang = Math.PI * 0.18 + (l * Math.PI * 0.64) / 6;
      const lx = Math.cos(ang) * 26;
      const ly = Math.sin(ang) * 13 + 21;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 8, 5, ang - Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    // Lotus Center Pad
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, 22, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Legs in Padmasana & Saffron Dhoti
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 18, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    const dhotiGrad = ctx.createLinearGradient(0, 8, 0, 24);
    dhotiGrad.addColorStop(0, '#f97316');
    dhotiGrad.addColorStop(0.6, '#ea580c');
    dhotiGrad.addColorStop(1, '#9a3412');
    ctx.fillStyle = dhotiGrad;
    ctx.beginPath();
    ctx.ellipse(0, 17, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Zari Border on Dhoti
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 19, 18, 9, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Golden Kamarbandh (Waist Belt)
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, 10);
    ctx.quadraticCurveTo(0, 13, 13, 10);
    ctx.stroke();
    ctx.fillStyle = '#ef4444'; // Central Ruby Buckle
    ctx.beginPath();
    ctx.arc(0, 11.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Noble Golden Torso (Round Devotional Belly)
    const torsoGrad = ctx.createRadialGradient(0, 2, 3, 0, 2, 18);
    torsoGrad.addColorStop(0, '#fef08a');
    torsoGrad.addColorStop(0.5, '#f59e0b');
    torsoGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 17, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Sacred Golden Janeu Thread
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.quadraticCurveTo(-2, 4, 10, 11);
    ctx.stroke();

    // 5. Divine Arms & Emblems
    // Upper Right Hand (Holding Golden Lotus / Ankusha)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(11, -3);
    ctx.lineTo(21, -11);
    ctx.stroke();
    // Lotus Blossom
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(22, -13, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Upper Left Hand (Holding Pasha / Noose of Wisdom)
    ctx.beginPath();
    ctx.moveTo(-11, -3);
    ctx.lineTo(-21, -11);
    ctx.stroke();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(-22, -12, 4, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Lower Right Hand (Abhaya Mudra - Blessing Gesture)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(13, 5);
    ctx.lineTo(20, 2);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(22, 1, 4.5, 5.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444'; // Auspicious lotus mark on blessing palm
    ctx.beginPath();
    ctx.arc(22, 1, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Lower Left Hand (Modakapatra - Golden Bowl of Modaks)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-13, 5);
    ctx.lineTo(-20, 6);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(-22, 7, 7, 4.5, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Sweet Modaks in bowl
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-24, 5, 2.5, 0, Math.PI * 2);
    ctx.arc(-21, 4, 3, 0, Math.PI * 2);
    ctx.arc(-18, 5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Large Devotional Elephant Ears
    const earFlap = this.ganeshaReaction === 'HAPPY' ? Math.sin(this.globalAnimTime * 15) * 3.5 : 0;
    // Left Ear Outer
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-19 - earFlap, -14, 11, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Left Ear Inner Pink Shading
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.ellipse(-19 - earFlap, -14, 7, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear Outer
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(19 + earFlap, -14, 11, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.stroke();
    // Right Ear Inner Pink Shading
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.ellipse(19 + earFlap, -14, 7, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 7. Head & Facial Features
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -14, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Auspicious Red Trishul Tilak on forehead
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.lineTo(1.5, -16);
    ctx.lineTo(0, -13);
    ctx.lineTo(-1.5, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef08a'; // Yellow center dot in tilak
    ctx.beginPath();
    ctx.arc(0, -18, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Single Sacred White Tusk (Right side)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(5, -9);
    ctx.lineTo(10, -7);
    ctx.lineTo(6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Benevolent Eyes
    ctx.fillStyle = '#1c0a02';
    ctx.beginPath();
    ctx.ellipse(-5, -14, 2.2, 2.8, -0.1, 0, Math.PI * 2);
    ctx.ellipse(5, -14, 2.2, 2.8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Eye Sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5.8, -15.2, 0.9, 0, Math.PI * 2);
    ctx.arc(4.2, -15.2, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 8. Dynamic Curved Trunk
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -9);

    if (this.ganeshaReaction === 'HAPPY') {
      // Raised trunk celebrating wisdom and victory!
      ctx.quadraticCurveTo(-8, -4, -10, -14);
      ctx.stroke();

      // Golden Modak floating joyfully above trunk
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-10, -16);
      ctx.quadraticCurveTo(-6, -21, -10, -25);
      ctx.quadraticCurveTo(-14, -21, -10, -16);
      ctx.fill();

      // Celebration Sparkles
      ctx.font = '14px sans-serif';
      ctx.fillText('✨', 18, -30);
      ctx.fillText('🌸', -22, -28);
    } else if (this.ganeshaReaction === 'PLAYFUL') {
      // Curious friendly tilt
      ctx.quadraticCurveTo(-6, -2, -2, 2);
      ctx.stroke();

      // Modak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-2, 3, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Majestic natural resting curve holding sacred modak
      ctx.quadraticCurveTo(-5, 0, 6, 0);
      ctx.stroke();

      // Golden Modak at trunk tip
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.quadraticCurveTo(12, 1, 8, 4);
      ctx.quadraticCurveTo(4, 1, 8, -2);
      ctx.fill();
    }

    // 9. Majestic Royal Crown (Mukut)
    const mukutGrad = ctx.createLinearGradient(0, -38, 0, -22);
    mukutGrad.addColorStop(0, '#fef08a');
    mukutGrad.addColorStop(0.5, '#fbbf24');
    mukutGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = mukutGrad;
    ctx.beginPath();
    ctx.moveTo(-12, -22);
    ctx.lineTo(-7, -32);
    ctx.lineTo(0, -40);
    ctx.lineTo(7, -32);
    ctx.lineTo(12, -22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Mukut Zari Engravings & Pearl Trim
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9, -24);
    ctx.lineTo(0, -36);
    ctx.lineTo(9, -24);
    ctx.stroke();

    // Mukut Royal Ruby Jewel
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -29, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Mukut Top Kalash Finial
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -41, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Render Speech Bubble for Ganesha
  private renderSpeechBubble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string
  ) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 8, 4, 0.90)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = "600 11.5px 'Outfit', sans-serif";
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap text into 2 lines if needed
    const words = text.split(' ');
    let line1 = '';
    let line2 = '';
    for (const word of words) {
      if ((line1 + word).length < 28 && line2 === '') {
        line1 += (line1 ? ' ' : '') + word;
      } else {
        line2 += (line2 ? ' ' : '') + word;
      }
    }

    if (line2) {
      ctx.fillText(line1, x + w / 2, y + h * 0.35);
      ctx.fillText(line2, x + w / 2, y + h * 0.70);
    } else {
      ctx.fillText(line1, x + w / 2, y + h * 0.5);
    }

    ctx.restore();
  }

  // 4. Cards Grid Layout & Rendering
  private layoutAndRenderCards(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPortrait: boolean
  ) {
    const numCards = this.cards.length;
    if (numCards === 0) return;

    let cols = 4;
    let rows = 2;

    if (numCards === 8) {
      cols = isPortrait ? 2 : 4;
      rows = isPortrait ? 4 : 2;
    } else if (numCards === 12) {
      if (isPortrait) {
        cols = 3;
        rows = 4;
      } else if (width > height * 1.5) {
        cols = 6;
        rows = 2;
      } else {
        cols = 4;
        rows = 3;
      }
    } else if (numCards === 16) {
      if (isPortrait) {
        cols = 4;
        rows = 4;
      } else if (width > height * 1.7) {
        cols = 8;
        rows = 2;
      } else {
        cols = 4;
        rows = 4;
      }
    }

    // Determine card bounds
    const topMargin = isPortrait ? 215 : 85;
    const bottomMargin = 20;

    let startAreaX = 0;
    let availW = 0;

    if (isPortrait) {
      startAreaX = 16;
      availW = width - 32;
    } else {
      // In landscape, reserve dedicated space for Ganesha on the left
      const leftAreaW = Math.min(280, Math.max(180, width * 0.24));
      startAreaX = leftAreaW + 16;
      availW = width - startAreaX - 24;
    }

    const availH = height - topMargin - bottomMargin;

    const gap = isPortrait ? 8 : 12;
    const maxCardW = (availW - (cols - 1) * gap) / cols;
    const maxCardH = (availH - (rows - 1) * gap) / rows;

    // Card aspect ratio: roughly 1:1.25
    let cardW = Math.min(maxCardW, maxCardH * 0.85);
    let cardH = cardW * 1.25;

    if (cardH > maxCardH) {
      cardH = maxCardH;
      cardW = cardH * 0.8;
    }

    // Cap maximum dimensions for crisp look on giant monitors
    cardW = Math.min(cardW, 130);
    cardH = Math.min(cardH, 160);

    const totalGridW = cols * cardW + (cols - 1) * gap;
    const totalGridH = rows * cardH + (rows - 1) * gap;

    const startX = startAreaX + (availW - totalGridW) / 2;
    const startY = topMargin + (availH - totalGridH) / 2;

    // Position and render each card
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= numCards) break;

        const card = this.cards[idx];
        card.x = startX + c * (cardW + gap);
        card.y = startY + r * (cardH + gap);
        card.w = cardW;
        card.h = cardH;

        this.renderSingleCard(ctx, card);
      }
    }
  }

  // Render a Single Card with 3D-perspective flip interpolation
  private renderSingleCard(ctx: CanvasRenderingContext2D, card: CardState) {
    ctx.save();
    ctx.translate(card.x + card.w / 2, card.y + card.h / 2);

    // Flip X scale: 0 is back (scale 1), 0.5 is edge (scale 0), 1 is face (scale 1)
    const scaleX = Math.abs(Math.cos(card.flipProgress * Math.PI));
    ctx.scale(scaleX, 1);

    const halfW = card.w / 2;
    const halfH = card.h / 2;

    // Matched card gentle glow
    if (card.isMatched) {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12 + card.matchSparkle * 18;
    }

    if (card.flipProgress < 0.5) {
      // ----------------------------------------------------
      // CARD BACK (Luxurious Maroon/Gold Mandap Design)
      // ----------------------------------------------------
      const backGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
      backGrad.addColorStop(0, '#5a1205');
      backGrad.addColorStop(0.5, '#7f1d1d');
      backGrad.addColorStop(1, '#450a0a');

      ctx.fillStyle = backGrad;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, card.w, card.h, 10);
      ctx.fill();

      // Ornate Gold Inset Border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(-halfW + 4, -halfH + 4, card.w - 8, card.h - 8);

      // Card Back Center Emblem: Sacred Golden Om & Diya Pattern
      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold ${Math.floor(card.w * 0.38)}px 'Cinzel', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ॐ', 0, 0);

      // Four corner tiny dots
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(-halfW + 8, -halfH + 8, 2, 0, Math.PI * 2);
      ctx.arc(halfW - 8, -halfH + 8, 2, 0, Math.PI * 2);
      ctx.arc(-halfW + 8, halfH - 8, 2, 0, Math.PI * 2);
      ctx.arc(halfW - 8, halfH - 8, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ----------------------------------------------------
      // CARD FACE (Vibrant Festive Front with Symbol & Name)
      // ----------------------------------------------------
      const faceGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
      faceGrad.addColorStop(0, '#2d1107');
      faceGrad.addColorStop(1, '#1c0803');

      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, card.w, card.h, 10);
      ctx.fill();

      // Glowing Colored Inset Border based on item type
      ctx.strokeStyle = card.type.color;
      ctx.lineWidth = card.isMatched ? 3 : 2;
      ctx.strokeRect(-halfW + 3, -halfH + 3, card.w - 6, card.h - 6);

      // Symbol / Vector Art
      const symbolSize = Math.floor(card.w * 0.44);
      ctx.font = `${symbolSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.type.symbol, 0, -halfH * 0.18);

      // Card Name Tag
      const fontSize = Math.max(9, Math.floor(card.w * 0.12));
      ctx.font = `700 ${fontSize}px 'Outfit', sans-serif`;
      ctx.fillStyle = card.type.secondaryColor;
      ctx.fillText(card.type.name, 0, halfH * 0.65);

      // Matched Ribbon Checkmark
      if (card.isMatched) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(halfW - 10, -halfH + 10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 9px 'Outfit', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✓', halfW - 10, -halfH + 10);
      }
    }

    ctx.restore();
  }

  // 5. Time's Up Screen Overlay
  private renderTimeUpOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const boxW = Math.min(width * 0.88, 420);
    const boxH = 290;

    // Card Box
    ctx.fillStyle = '#1c0803';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Header: TIME'S UP!
    ctx.font = "900 32px 'Cinzel', serif";
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillText("TIME'S UP!", centerX, centerY - 80);
    ctx.shadowBlur = 0;

    // Subtext
    ctx.font = "600 15px 'Outfit', sans-serif";
    ctx.fillStyle = '#fde68a';
    ctx.fillText(`You matched ${this.matchesCount} pairs in Level ${this.currentLevel}.`, centerX, centerY - 35);
    ctx.font = "500 13px 'Outfit', sans-serif";
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText("Keep your focus, Bappa's wisdom is with you!", centerX, centerY - 10);

    // TRY AGAIN Button
    const btnW = Math.min(boxW - 60, 260);
    const btnH = 46;
    const tryY = centerY + 45;
    this.tryAgainBtnRect = { x: centerX - btnW / 2, y: tryY - btnH / 2, w: btnW, h: btnH };

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(this.tryAgainBtnRect.x, this.tryAgainBtnRect.y, btnW, btnH, 14);
    ctx.fill();

    ctx.font = "900 15px 'Cinzel', serif";
    ctx.fillStyle = '#1c0a02';
    ctx.fillText('TRY AGAIN ↻', centerX, tryY);

    // RETURN TO WORLD Button
    const retY = centerY + 105;
    const retW = Math.min(boxW - 60, 220);
    const retH = 38;
    this.returnBtnRect = { x: centerX - retW / 2, y: retY - retH / 2, w: retW, h: retH };

    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(this.returnBtnRect.x, this.returnBtnRect.y, retW, retH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "700 13px 'Cinzel', serif";
    ctx.fillStyle = '#fde68a';
    ctx.fillText('← RETURN TO WORLD', centerX, retY);
  }

  // 6. Celebration Flash ("WISDOM UNLOCKED!")
  private renderCelebrationFlash(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const alpha = Math.min(1, this.celebrationTimer * 0.8);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * alpha})`;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glowing radiant title: WISDOM UNLOCKED!
    const pulse = 1 + Math.sin(this.globalAnimTime * 10) * 0.08;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(pulse, pulse);

    ctx.font = "900 40px 'Cinzel', serif";
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(245, 158, 11, 1)';
    ctx.shadowBlur = 30;
    ctx.fillText('WISDOM UNLOCKED!', 0, -20);
    ctx.shadowBlur = 0;

    ctx.font = "600 18px 'Outfit', sans-serif";
    ctx.fillStyle = '#fef08a';
    ctx.fillText('✨ All Sacred Pairs Completed! ✨', 0, 30);
    ctx.restore();
  }

  // 7. Completed Summary Screen
  private renderCompletedScreen(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const boxW = Math.min(width * 0.90, 480);
    const boxH = 400;

    // Summary Card Box
    const grad = ctx.createLinearGradient(0, centerY - boxH / 2, 0, centerY + boxH / 2);
    grad.addColorStop(0, '#2d1107');
    grad.addColorStop(1, '#140502');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Celebration Icon
    ctx.font = '36px sans-serif';
    ctx.fillText('🪔', centerX, centerY - 145);

    // Title: BAPPA MATCH COMPLETE
    ctx.font = "900 24px 'Cinzel', serif";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('BAPPA MATCH COMPLETE', centerX, centerY - 100);

    // Stats Grid Box
    const statBoxW = boxW - 50;
    const statBoxH = 120;
    const statBoxY = centerY - 15;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(centerX - statBoxW / 2, statBoxY - statBoxH / 2, statBoxW, statBoxH, 16);
    ctx.fill();
    ctx.stroke();

    const colW = statBoxW / 3;

    // Stat 1: Final Score
    const s1X = centerX - statBoxW / 2 + colW * 0.5;
    ctx.font = "600 11px 'Outfit', sans-serif";
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('FINAL SCORE', s1X, statBoxY - 24);
    ctx.font = "900 22px 'Cinzel', serif";
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.score}`, s1X, statBoxY + 12);

    // Stat 2: Pairs Matched
    const s2X = centerX - statBoxW / 2 + colW * 1.5;
    ctx.font = "600 11px 'Outfit', sans-serif";
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('PAIRS MATCHED', s2X, statBoxY - 24);
    ctx.font = "900 22px 'Cinzel', serif";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${this.totalPairsMatched}`, s2X, statBoxY + 12);

    // Stat 3: Total Time
    const s3X = centerX - statBoxW / 2 + colW * 2.5;
    ctx.font = "600 11px 'Outfit', sans-serif";
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('TOTAL TIME', s3X, statBoxY - 24);
    ctx.font = "900 22px 'Cinzel', serif";
    ctx.fillStyle = '#34d399';
    ctx.fillText(`${Math.round(this.totalTimeTaken)}s`, s3X, statBoxY + 12);

    // PLAY AGAIN Button
    const btnW = Math.min(boxW - 60, 260);
    const btnH = 46;
    const playY = centerY + 90;
    this.playAgainBtnRect = { x: centerX - btnW / 2, y: playY - btnH / 2, w: btnW, h: btnH };

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(this.playAgainBtnRect.x, this.playAgainBtnRect.y, btnW, btnH, 14);
    ctx.fill();

    ctx.font = "900 15px 'Cinzel', serif";
    ctx.fillStyle = '#1c0a02';
    ctx.fillText('PLAY AGAIN ↻', centerX, playY);

    // RETURN TO WORLD Button
    const retY = centerY + 148;
    const retW = Math.min(boxW - 60, 220);
    const retH = 38;
    this.returnBtnRect = { x: centerX - retW / 2, y: retY - retH / 2, w: retW, h: retH };

    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(this.returnBtnRect.x, this.returnBtnRect.y, retW, retH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "700 13px 'Cinzel', serif";
    ctx.fillStyle = '#fde68a';
    ctx.fillText('← RETURN TO WORLD', centerX, retY);
  }

  // 8. "Why This Game" Popup
  private renderWhyModal(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const boxW = Math.min(width * 0.90, 480);
    const boxH = 380;

    // Popover Box
    ctx.fillStyle = '#1f0903';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Header Icon & Title
    ctx.font = '28px sans-serif';
    ctx.fillText('📜', centerX, centerY - 130);

    ctx.font = "900 20px 'Cinzel', serif";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('Why This Game?', centerX, centerY - 95);

    // Story Text
    const story =
      'Ganesha and Kartikeya were once given a challenge to go around the world. Kartikeya rushed away on his peacock, while Ganesha used his wisdom and went around his parents, Shiva and Parvati, saying they were his whole world. His wisdom won him the special modak.';

    this.renderWrappedText(
      ctx,
      story,
      centerX,
      centerY - 40,
      boxW - 50,
      18,
      "13px 'Outfit', sans-serif",
      '#fef08a'
    );

    // Ending punchline
    ctx.font = "700 14px 'Cinzel', serif";
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('Use your memory and wisdom to find every pair!', centerX, centerY + 65);

    // CLOSE Button
    const btnW = 160;
    const btnH = 42;
    const btnY = centerY + 125;
    this.closeWhyBtnRect = { x: centerX - btnW / 2, y: btnY - btnH / 2, w: btnW, h: btnH };

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(this.closeWhyBtnRect.x, this.closeWhyBtnRect.y, btnW, btnH, 12);
    ctx.fill();

    ctx.font = "900 14px 'Cinzel', serif";
    ctx.fillStyle = '#1c0a02';
    ctx.fillText('CLOSE', centerX, btnY);
  }

  // Helper for multi-line wrapped text
  private renderWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    font: string,
    color: string
  ) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';

    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i].trim(), x, startY + i * lineHeight);
    }
  }

  // 9. Particle Renderer
  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
