/**
 * Chapter 2: Ganesha & Mahabharata — The Epic Scribe
 * A rich, story-driven, mythic typing-speed game.
 *
 * Sage Vyasa dictates the eternal epic; Lord Ganesha writes without pause.
 * Features:
 * - Ganesha as the prominent, animated MAIN visual focus of the game
 * - Dynamic Ganesha reactions (writing speed, focus, combo aura, tusk empowerment)
 * - Individual countdown timer for every passage with tension warnings
 * - Real-time WPM, Accuracy, and Combo Multipliers
 * - Tangible Palm-Leaf Manuscript with real page-turning animation and progress
 * - Ink well management & rapid sacred word refill challenge
 * - The iconic Sacred Tusk Story Event (happens once at Level 3 transition)
 * - Vyasa Speed Challenge with 2x score surge
 * - Contextual Vyasa speech bubbles with light, respectful humour
 * - Short dismissible "Did You Know?" educational cards at level milestones
 * - 3-Level progression (Begin Manuscript -> Great Dictation -> The Writing Must Continue)
 * - Full responsiveness on mobile portrait, landscape, and desktop
 */

import { soundEngine } from '../../audio/soundEngine';
import { FeastGameResult, Particle } from '../../types';
import { GameStorage } from '../../utils/storage';
import { GameRenderer } from '../renderer';

export interface PassageData {
  text: string;
  stage: 1 | 2 | 3;
  baseTime: number; // in seconds
}

export class ScribeScene {
  // Core Gameplay Metrics
  public score: number = 0;
  public wpm: number = 0;
  public accuracy: number = 100;
  public combo: number = 0;
  public bestCombo: number = 0;
  public timeElapsed: number = 0;
  public manuscriptProgress: number = 0; // 0 to 100
  public isGameOver: boolean = false;
  public isCompleted: boolean = false;

  // Passage Real-Time Countdown Timer (At least 20 seconds minimum)
  public passageSecondsRemaining: number = 20;
  public passageMaxTime: number = 20;
  public isTimeWarning: boolean = false;
  private secondElapsedAccumulator: number = 0;
  private lastTickedSecond: number = -1;
  private isTransitioningPassage: boolean = false;
  private pendingTransitionTimeout: number | null = null;
  private lastKeystrokeTime: number = 0;

  // Ink System
  public inkLevel: number = 100; // 0 to 100
  public isRefillingInk: boolean = false;
  public refillTargetWord: string = 'GANESHA';
  public refillTypedText: string = '';

  // The Tusk Moment (Major Story Event - ONCE)
  public tuskEmpowered: boolean = false;
  public isTuskCinematic: boolean = false;
  public tuskCinematicTimer: number = 0;
  public hasTuskHappened: boolean = false;

  // Vyasa Speed Challenge
  public isSpeedChallenge: boolean = false;
  public speedChallengeTimer: number = 0;
  public speedChallengeCount: number = 0;

  // Vyasa Dialogue & Light Humour
  public vyasaDialogueText: string = '';
  public vyasaDialogueTimer: number = 0;
  private consecutiveMistakes: number = 0;

  // Educational "Did You Know?" Modal
  public activeDidYouKnow: string | null = null;

  // Manuscript Page Turning Animation
  public pageTurnAnim: number = 0; // 0 to 1
  public completedPagesCount: number = 0;

  // Typing State
  public currentPassageIndex: number = 0;
  public currentPassage: string = '';
  public typedText: string = '';
  public lastMistakeTime: number = -1;
  public currentStage: 1 | 2 | 3 = 1;

  // Tracking for WPM & Accuracy
  private totalKeystrokes: number = 0;
  private correctKeystrokes: number = 0;
  private activeTypingSeconds: number = 0;

  // Visuals, Animation & Particles
  private inkParticles: Particle[] = [];
  private ambientPetals: Particle[] = [];
  private incenseParticles: Particle[] = [];
  private ganeshaWritingCycle: number = 0;
  private ganeshaWritingSpeed: number = 0;
  private vyasaGestureCycle: number = 0;
  private time: number = 0;
  private passageCompleteAnim: number = 0;

  // 12 Curated Epic Passages across 3 Distinct Stages (Each at least 20s minimum!)
  private readonly PASSAGES: PassageData[] = [
    // LEVEL 1: BEGIN THE MANUSCRIPT (Short, peaceful, beginner-friendly)
    { text: "In the quiet forest, Sage Vyasa began to speak.", stage: 1, baseTime: 22 },
    { text: "Lord Ganesha dipped his reed stylus into sacred ink.", stage: 1, baseTime: 22 },
    { text: "Not a single moment of silence must pass between us.", stage: 1, baseTime: 20 },
    { text: "Every verse carries the eternal wisdom of the cosmos.", stage: 1, baseTime: 20 },

    // LEVEL 2: THE GREAT DICTATION (Richer vocabulary, ink management active, Vyasa challenge)
    { text: "Dharma is the foundation that upholds all celestial worlds.", stage: 2, baseTime: 22 },
    { text: "Truth alone triumphs over the darkest veils of cosmic illusion.", stage: 2, baseTime: 22 },
    { text: "Where righteousness guides the heart, victory shall surely follow.", stage: 2, baseTime: 22 },
    { text: "The heroic deeds of great souls echo across the river of time.", stage: 2, baseTime: 22 },

    // LEVEL 3: THE WRITING MUST CONTINUE (Tusk empowered, faster dictation, epic finale)
    { text: "When the stylus broke, the Lord severed his own sacred tusk.", stage: 3, baseTime: 22 },
    { text: "With the divine ivory in hand, the golden words flowed anew.", stage: 3, baseTime: 22 },
    { text: "Neither time nor fate could halt the eternal song of wisdom.", stage: 3, baseTime: 20 },
    { text: "The great Mahabharata epic is carved forever in the heavens.", stage: 3, baseTime: 20 },
  ];

  private readonly REFILL_WORDS = ['GANESHA', 'VYASA', 'DHARMA', 'SHREE', 'VEDA', 'MODAK'];
  private onGameOverCallback: (result: FeastGameResult) => void;

  constructor(onGameOver: (result: FeastGameResult) => void) {
    this.onGameOverCallback = onGameOver;
    this.reset();
  }

  public reset() {
    if (this.pendingTransitionTimeout) {
      window.clearTimeout(this.pendingTransitionTimeout);
      this.pendingTransitionTimeout = null;
    }

    this.score = 0;
    this.wpm = 0;
    this.accuracy = 100;
    this.combo = 0;
    this.bestCombo = 0;
    this.timeElapsed = 0;
    this.manuscriptProgress = 0;
    this.isGameOver = false;
    this.isCompleted = false;

    this.passageSecondsRemaining = 20;
    this.passageMaxTime = 20;
    this.secondElapsedAccumulator = 0;
    this.lastTickedSecond = -1;
    this.isTimeWarning = false;
    this.isTransitioningPassage = false;
    this.lastKeystrokeTime = 0;

    this.inkLevel = 100;
    this.isRefillingInk = false;
    this.refillTargetWord = 'GANESHA';
    this.refillTypedText = '';

    this.tuskEmpowered = false;
    this.isTuskCinematic = false;
    this.tuskCinematicTimer = 0;
    this.hasTuskHappened = false;

    this.isSpeedChallenge = false;
    this.speedChallengeTimer = 0;
    this.speedChallengeCount = 0;

    this.vyasaDialogueText = 'Begin when you are ready, O Ganesha.';
    this.vyasaDialogueTimer = 3.5;
    this.consecutiveMistakes = 0;

    this.activeDidYouKnow = null;
    this.pageTurnAnim = 0;
    this.completedPagesCount = 0;

    this.currentPassageIndex = 0;
    this.typedText = '';
    this.lastMistakeTime = -1;
    this.currentStage = 1;

    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.activeTypingSeconds = 0;

    this.inkParticles = [];
    this.ambientPetals = [];
    this.incenseParticles = [];
    this.ganeshaWritingCycle = 0;
    this.ganeshaWritingSpeed = 0;
    this.vyasaGestureCycle = 0;
    this.time = 0;
    this.passageCompleteAnim = 0;

    this.initAtmosphereParticles();
    this.loadPassage(0);
  }

  private pendingGameOverResult: FeastGameResult | null = null;

  public cleanUp() {
    if (this.pendingTransitionTimeout) {
      window.clearTimeout(this.pendingTransitionTimeout);
      this.pendingTransitionTimeout = null;
      if (this.pendingGameOverResult) {
        const res = this.pendingGameOverResult;
        this.pendingGameOverResult = null;
        this.onGameOverCallback(res);
      }
    }
    this.isGameOver = true;
    this.lastTickedSecond = -1;
  }

  private initAtmosphereParticles() {
    this.ambientPetals = [];
    for (let i = 0; i < 28; i++) {
      this.ambientPetals.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        vx: -0.25 + Math.random() * 0.5,
        vy: 0.35 + Math.random() * 0.65,
        size: 3.5 + Math.random() * 4,
        color: Math.random() > 0.4 ? '#f59e0b' : '#ea580c',
        alpha: 0.3 + Math.random() * 0.5,
        life: 0,
        maxLife: 999,
      });
    }

    this.incenseParticles = [];
    for (let i = 0; i < 20; i++) {
      this.incenseParticles.push({
        x: 60 + Math.random() * 40,
        y: 600 - Math.random() * 200,
        vx: -0.15 + Math.random() * 0.3,
        vy: -0.4 - Math.random() * 0.5,
        size: 2 + Math.random() * 4,
        color: 'rgba(254, 243, 199, 0.4)',
        alpha: 0.2 + Math.random() * 0.4,
        life: 0,
        maxLife: 999,
      });
    }
  }

  private loadPassage(index: number) {
    if (this.pendingTransitionTimeout) {
      window.clearTimeout(this.pendingTransitionTimeout);
      this.pendingTransitionTimeout = null;
    }

    if (index >= this.PASSAGES.length) {
      this.triggerVictory();
      return;
    }

    this.currentPassageIndex = index;
    const passage = this.PASSAGES[index];
    this.currentPassage = passage.text;
    this.typedText = '';
    this.currentStage = passage.stage;
    this.consecutiveMistakes = 0;
    this.isTransitioningPassage = false;

    // Calculate countdown timer: ALWAYS at least 20 seconds minimum!
    const passageTime = Math.max(20, passage.baseTime);
    this.passageSecondsRemaining = passageTime;
    this.passageMaxTime = passageTime;
    this.secondElapsedAccumulator = 0;
    this.lastTickedSecond = -1; // Ready for countdown ticks at 5, 4, 3, 2, 1
    this.isTimeWarning = false;

    this.manuscriptProgress = Math.round((index / this.PASSAGES.length) * 100);

    // Speed Challenge 1 at passage 5 (Stage 2)
    if (index === 5 && this.speedChallengeCount === 0) {
      this.triggerSpeedChallenge();
    }
    // Speed Challenge 2 at passage 9 (Stage 3)
    if (index === 9 && this.speedChallengeCount === 1) {
      this.triggerSpeedChallenge();
    }

    // Tusk Moment at Stage 3 transition (passage 8)
    if (index === 8 && !this.hasTuskHappened) {
      this.triggerTuskMoment();
    }
  }

  private triggerSpeedChallenge() {
    this.speedChallengeCount++;
    this.isSpeedChallenge = true;
    this.speedChallengeTimer = 16;
    this.setVyasaDialogue('Keep up with the cosmic rhythm, O Ganesha!');
    soundEngine.playSpeedSurge();
  }

  private triggerTuskMoment() {
    this.hasTuskHappened = true;
    this.isTuskCinematic = true;
    this.tuskCinematicTimer = 5.0;
    this.tuskEmpowered = true;
    this.setVyasaDialogue('The reed pen broke! But the sacred dictation must not halt.');
    soundEngine.playTuskBreak();
  }

  public dismissTuskCinematic() {
    if (this.isTuskCinematic) {
      this.isTuskCinematic = false;
      this.tuskCinematicTimer = 0;
      soundEngine.playTempleBell(1.3);
      this.setVyasaDialogue('Magnificent sacrifice! The writing continues in divine gold.');
    }
  }

  private triggerDidYouKnow(factText: string) {
    this.activeDidYouKnow = factText;
    soundEngine.playTempleBell(1.1);
  }

  public dismissDidYouKnow() {
    if (this.activeDidYouKnow) {
      this.activeDidYouKnow = null;
      soundEngine.playClick();
    }
  }

  private setVyasaDialogue(text: string, duration: number = 3.5) {
    this.vyasaDialogueText = text;
    this.vyasaDialogueTimer = duration;
  }

  private triggerRefillChallenge() {
    this.isRefillingInk = true;
    const wordIdx = Math.floor(Math.random() * this.REFILL_WORDS.length);
    this.refillTargetWord = this.REFILL_WORDS[wordIdx];
    this.refillTypedText = '';
    this.setVyasaDialogue('The inkwell runs dry! Inscribe the sacred name to replenish it.');
    soundEngine.playMistake();
  }

  /**
   * Primary Keystroke Input Handler
   */
  public handleInput(key: string) {
    if (this.isGameOver || this.isCompleted || this.passageSecondsRemaining <= 0 || this.isTransitioningPassage) return;

    // Dismiss Educational Did You Know modal on any input
    if (this.activeDidYouKnow) {
      this.dismissDidYouKnow();
      return;
    }

    // Dismiss Tusk Cinematic on any input
    if (this.isTuskCinematic) {
      this.dismissTuskCinematic();
      return;
    }

    // Handle INK REFILL Challenge mode
    if (this.isRefillingInk) {
      this.handleRefillInput(key);
      return;
    }

    if (key === 'Backspace') {
      if (this.typedText.length > 0) {
        this.typedText = this.typedText.slice(0, -1);
        soundEngine.playClick();
      }
      return;
    }

    // Only process printable characters of length 1
    if (key.length !== 1) return;

    this.totalKeystrokes++;
    const targetChar = this.currentPassage[this.typedText.length];
    if (!targetChar) return;

    if (key === targetChar) {
      // Correct Character Typed!
      this.lastKeystrokeTime = this.time;
      this.typedText += key;
      this.correctKeystrokes++;
      this.consecutiveMistakes = 0;

      // Accelerated writing animation (visibly driven by player typing!)
      this.ganeshaWritingCycle += 0.6;
      this.ganeshaWritingSpeed = Math.min(3.5, this.ganeshaWritingSpeed + 0.6);

      // Sound & ink particles
      soundEngine.playInkStroke();
      this.spawnWritingInkParticles(this.tuskEmpowered ? '#fbbf24' : '#1e1b4b');

      // Ink consumption (slightly lower in Stage 1)
      const inkDrain = this.currentStage === 1 ? 0.75 : 1.05;
      this.inkLevel = Math.max(0, this.inkLevel - inkDrain);

      // Score calculation
      const multiplier = (this.isSpeedChallenge ? 2 : 1) * (1 + Math.min(5, Math.floor(this.combo / 4)) * 0.25);
      this.score += Math.round(12 * multiplier);

      // Vyasa praise on strong combo
      if (this.combo === 4 && this.vyasaDialogueTimer <= 0) {
        this.setVyasaDialogue('Excellent. Keep going!');
      }

      // Check if ink is empty
      if (this.inkLevel <= 0) {
        this.triggerRefillChallenge();
        return;
      }

      // Check if passage completed
      if (this.typedText === this.currentPassage) {
        this.onPassageCompleted();
      }
    } else {
      // Mistake
      soundEngine.playMistake();
      this.lastMistakeTime = this.time;
      this.combo = 0;
      this.consecutiveMistakes++;
      this.ganeshaWritingSpeed = Math.max(0, this.ganeshaWritingSpeed - 0.4);

      // Vyasa humorous light feedback on consecutive mistakes
      if (this.consecutiveMistakes >= 2) {
        this.setVyasaDialogue('Are you writing… or inventing a new epic?');
      }
    }

    this.updateStats();
  }

  private handleRefillInput(key: string) {
    if (key === 'Backspace') {
      if (this.refillTypedText.length > 0) {
        this.refillTypedText = this.refillTypedText.slice(0, -1);
        soundEngine.playClick();
      }
      return;
    }

    if (key.length !== 1) return;

    const charUpper = key.toUpperCase();
    const targetChar = this.refillTargetWord[this.refillTypedText.length];

    if (charUpper === targetChar) {
      this.refillTypedText += charUpper;
      soundEngine.playInkStroke();

      if (this.refillTypedText === this.refillTargetWord) {
        // Refill Complete!
        this.inkLevel = 100;
        this.isRefillingInk = false;
        soundEngine.playRefillSuccess();
        this.score += 200;
        this.setVyasaDialogue('The inkwell overflows with divine nectar! Write on!');
      }
    } else {
      soundEngine.playMistake();
    }
  }

  private onPassageCompleted() {
    // 1. Stop timer and countdown sounds immediately
    this.isTransitioningPassage = true;
    this.lastTickedSecond = -1;

    this.combo++;
    if (this.combo > this.bestCombo) {
      this.bestCombo = this.combo;
    }

    // 2. Let Ganesha finish the writing action flourish
    this.passageCompleteAnim = 1.0;
    this.pageTurnAnim = 1.0; // Trigger page-turn visual animation
    this.completedPagesCount++;
    this.ganeshaWritingSpeed = 1.8;

    soundEngine.playCollectFood(this.combo);

    if (this.combo % 3 === 0) {
      soundEngine.playComboStreak(this.combo);
    }

    // 3. Award verse completion points with speed bonus based on remaining seconds
    const speedBonus = this.passageSecondsRemaining * 20;
    const bonus = 120 + speedBonus + this.combo * 30 + (this.tuskEmpowered ? 150 : 0);
    this.score += bonus;

    // 4. Vyasa reaction for fast completion
    if (this.passageSecondsRemaining > this.passageMaxTime * 0.4) {
      this.setVyasaDialogue('That was well written.');
    }

    const nextIndex = this.currentPassageIndex + 1;

    // 5. Update manuscript progress
    this.manuscriptProgress = Math.min(100, Math.round((nextIndex / this.PASSAGES.length) * 100));

    // Check for level milestones & educational modals
    if (this.currentPassageIndex === 3) {
      // Completed Stage 1
      window.setTimeout(() => {
        if (!this.isGameOver) {
          this.triggerDidYouKnow(
            'Did you know? Ganesha agreed to write on one condition: Sage Vyasa had to dictate continuously without stopping!'
          );
        }
      }, 350);
    } else if (this.currentPassageIndex === 7) {
      // Completed Stage 2
      window.setTimeout(() => {
        if (!this.isGameOver) {
          this.triggerDidYouKnow(
            'Did you know? The Mahabharata contains over 100,000 verses across 18 Parvas, making it one of the longest epic poems in human history!'
          );
        }
      }, 350);
    }

    // 6. Smoothly advance to next passage (starting a fresh 20-second minimum countdown)
    if (this.pendingTransitionTimeout) {
      window.clearTimeout(this.pendingTransitionTimeout);
    }
    this.pendingTransitionTimeout = window.setTimeout(() => {
      if (!this.isGameOver) {
        this.loadPassage(nextIndex);
      }
    }, 450);
  }

  private updateStats() {
    // WPM = (all correct characters / 5) / (elapsed minutes)
    if (this.activeTypingSeconds > 2) {
      const minutes = this.activeTypingSeconds / 60;
      const rawWpm = Math.round((this.correctKeystrokes / 5) / minutes);
      this.wpm = Math.max(0, Math.min(180, rawWpm));
    } else {
      this.wpm = 0;
    }

    // Accuracy = (correctKeystrokes / totalKeystrokes) * 100
    if (this.totalKeystrokes > 0) {
      this.accuracy = Math.max(0, Math.min(100, Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)));
    } else {
      this.accuracy = 100;
    }
  }

  private triggerVictory() {
    this.isCompleted = true;
    console.log('[GAME OVER] unstoppable_scribe', { score: this.score });
    this.isGameOver = true;
    this.manuscriptProgress = 100;
    this.ganeshaWritingSpeed = 0;
    soundEngine.playTempleBell(1.2);
    setTimeout(() => soundEngine.playTempleBell(1.6), 250);

    const { isNewBest, previousBest } = GameStorage.recordChapterScore('unstoppable_scribe', this.score);

    const result: FeastGameResult = {
      chapterId: 'unstoppable_scribe',
      score: this.score,
      foodCollected: this.currentPassageIndex,
      bestCombo: this.bestCombo,
      timeSurvivedSeconds: Math.floor(this.timeElapsed),
      isNewBest,
      previousBest,
      wpm: this.wpm,
      accuracy: this.accuracy,
      completed: true,
      reason: 'completed',
      manuscriptProgress: 100,
    };

    this.pendingGameOverResult = result;
    if (this.pendingTransitionTimeout) {
      window.clearTimeout(this.pendingTransitionTimeout);
    }
    this.pendingTransitionTimeout = window.setTimeout(() => {
      if (this.pendingGameOverResult) {
        const res = this.pendingGameOverResult;
        this.pendingGameOverResult = null;
        console.log('[CALLBACK] unstoppable_scribe', res);
        this.onGameOverCallback(res);
      }
    }, 300);
  }

  public handleTimeExpired() {
    if (this.isGameOver) return;
    console.log('[GAME OVER] unstoppable_scribe', { score: this.score });
    this.isGameOver = true;
    this.isCompleted = false;
    this.passageSecondsRemaining = 0;
    this.secondElapsedAccumulator = 0;
    this.lastTickedSecond = -1;

    // Immediately stop Ganesha's writing animation
    this.ganeshaWritingSpeed = 0;

    // Play distinct time-up sound
    soundEngine.playTimeUp();

    this.setVyasaDialogue('Time is up! The sacred dictation has paused.');

    const { isNewBest, previousBest } = GameStorage.recordChapterScore('unstoppable_scribe', this.score);

    const result: FeastGameResult = {
      chapterId: 'unstoppable_scribe',
      score: this.score,
      foodCollected: this.currentPassageIndex,
      bestCombo: this.bestCombo,
      timeSurvivedSeconds: Math.floor(this.timeElapsed),
      isNewBest,
      previousBest,
      wpm: this.wpm,
      accuracy: this.accuracy,
      completed: false,
      reason: 'time_up',
      manuscriptProgress: this.manuscriptProgress,
    };

    this.pendingGameOverResult = result;
    if (this.pendingTransitionTimeout) {
      window.clearTimeout(this.pendingTransitionTimeout);
    }
    this.pendingTransitionTimeout = window.setTimeout(() => {
      if (this.pendingGameOverResult) {
        const res = this.pendingGameOverResult;
        this.pendingGameOverResult = null;
        console.log('[CALLBACK] unstoppable_scribe', res);
        this.onGameOverCallback(res);
      }
    }, 300);
  }

  public triggerWritingStopped() {
    this.handleTimeExpired();
  }

  public handlePointerClick(clientX: number, clientY: number) {
    if (this.activeDidYouKnow) {
      this.dismissDidYouKnow();
      return;
    }
    if (this.isTuskCinematic) {
      this.dismissTuskCinematic();
      return;
    }
    // Interactive dismiss on click
    if (clientX && clientY) {
      this.ganeshaWritingCycle += 0.4;
    }
  }

  public update(dt: number) {
    this.time += dt;

    // Writing speed decays gently when player is not actively typing
    if (this.time - this.lastKeystrokeTime > 0.32) {
      this.ganeshaWritingSpeed = Math.max(0, this.ganeshaWritingSpeed - dt * 3.5);
    }
    if (this.isGameOver) {
      this.ganeshaWritingSpeed = 0;
    }

    // Animated character cycles
    this.vyasaGestureCycle += dt * (this.isSpeedChallenge ? 3.5 : 1.6);
    if (!this.isGameOver && (this.ganeshaWritingSpeed > 0.05 || this.passageCompleteAnim > 0)) {
      this.ganeshaWritingCycle += dt * (1.2 + this.ganeshaWritingSpeed * 2.5);
    }

    // Passage completion flash decay
    if (this.passageCompleteAnim > 0) {
      this.passageCompleteAnim = Math.max(0, this.passageCompleteAnim - dt * 2.5);
    }

    // Page-turn animation decay
    if (this.pageTurnAnim > 0) {
      this.pageTurnAnim = Math.max(0, this.pageTurnAnim - dt * 2.0);
    }

    // Vyasa dialogue timer decay
    if (this.vyasaDialogueTimer > 0) {
      this.vyasaDialogueTimer -= dt;
    }

    // Speed challenge timer
    if (this.isSpeedChallenge && !this.isGameOver) {
      this.speedChallengeTimer -= dt;
      if (this.speedChallengeTimer <= 0) {
        this.isSpeedChallenge = false;
        this.setVyasaDialogue('Well kept! The epic returns to its steady pace.');
      }
    }

    // Particles always update smoothly
    this.updateParticles(dt);

    // PAUSE TIMER during non-gameplay overlays or states:
    // - story/information overlays (activeDidYouKnow)
    // - tusk cinematic (isTuskCinematic)
    // - game-over screen (isGameOver)
    // - completion screen (isCompleted)
    // - ink refill challenge (isRefillingInk)
    // - passage transition delay (isTransitioningPassage)
    if (
      this.isGameOver ||
      this.isCompleted ||
      this.isTuskCinematic ||
      this.activeDidYouKnow !== null ||
      this.isRefillingInk ||
      this.isTransitioningPassage
    ) {
      return;
    }

    this.timeElapsed += dt;
    this.activeTypingSeconds += dt;
    this.updateStats();

    // REAL-TIME COUNTDOWN TIMER: Decreases exactly once per second
    // 20 -> 19 -> 18 -> ... -> 5 -> 4 -> 3 -> 2 -> 1 -> 0
    this.secondElapsedAccumulator += dt;
    while (this.secondElapsedAccumulator >= 1.0 && this.passageSecondsRemaining > 0) {
      this.secondElapsedAccumulator -= 1.0;
      this.passageSecondsRemaining--;

      // FINAL 5-SECOND COUNTDOWN SOUND:
      // Plays once every second strictly during 5, 4, 3, 2, 1
      if (this.passageSecondsRemaining <= 5 && this.passageSecondsRemaining >= 1) {
        if (this.lastTickedSecond !== this.passageSecondsRemaining) {
          this.lastTickedSecond = this.passageSecondsRemaining;
          soundEngine.playTimerTick(this.passageSecondsRemaining);
          this.isTimeWarning = true;
          if (this.passageSecondsRemaining === 5 && this.vyasaDialogueTimer <= 0) {
            this.setVyasaDialogue('Five seconds remain! Write swiftly!');
          }
        }
      }

      // AT 0 SECONDS:
      // - Stop the countdown
      // - Play distinct time-up sound
      // - Stop player typing
      // - Stop Ganesha's writing animation
      // - Trigger TIME'S UP screen
      if (this.passageSecondsRemaining === 0) {
        this.handleTimeExpired();
        return;
      }
    }
  }

  private updateParticles(dt: number) {
    // Ink particles
    for (let i = this.inkParticles.length - 1; i >= 0; i--) {
      const p = this.inkParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.inkParticles.splice(i, 1);
      }
    }

    // Ambient floating marigold petals
    for (const petal of this.ambientPetals) {
      petal.y += petal.vy;
      petal.x += petal.vx + Math.sin(this.time * 2 + petal.y * 0.01) * 0.3;
      if (petal.y > 850) {
        petal.y = -15;
        petal.x = Math.random() * 1200;
      }
    }

    // Incense smoke motes
    for (const s of this.incenseParticles) {
      s.y += s.vy;
      s.x += s.vx + Math.sin(this.time * 1.5 + s.y * 0.02) * 0.4;
      if (s.y < 200) {
        s.y = 650;
        s.x = 60 + Math.random() * 60;
      }
    }
  }

  private spawnWritingInkParticles(color: string) {
    for (let i = 0; i < 4; i++) {
      this.inkParticles.push({
        x: (window.innerWidth / 2) + (-20 + Math.random() * 40),
        y: (window.innerHeight * 0.6) + (-10 + Math.random() * 20),
        vx: -25 + Math.random() * 50,
        vy: -35 + Math.random() * 30,
        size: 2.5 + Math.random() * 3,
        color,
        alpha: 0.9,
        life: 0,
        maxLife: 0.5,
      });
    }
  }

  /**
   * Main Render Pass
   */
  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const isPortrait = height > width;

    // 1. Deep sacred hermitage atmosphere (warm temple glow, lamps, archway)
    this.renderAtmosphere(ctx, width, height, isPortrait);

    // 2. Animated Characters: Sage Vyasa and Lord Ganesha (Large, prominent protagonist)
    this.renderCharacters(ctx, width, height, isPortrait);

    // 3. Central Illuminated Palm-Leaf Manuscript & Page Turning
    this.renderManuscript(ctx, width, height, isPortrait);

    // 4. Ambient floating petals and incense smoke
    GameRenderer.drawParticles(ctx, this.ambientPetals);
    GameRenderer.drawParticles(ctx, this.incenseParticles);
    GameRenderer.drawParticles(ctx, this.inkParticles);

    // 5. Special Event Overlays (Tusk Moment / Ink Refill / Speed Challenge / Did You Know)
    this.renderEventOverlays(ctx, width, height, isPortrait);

    // 6. Top Mythic HUD Bar (Score, Countdown, WPM, Accuracy, Ink)
    this.renderHUD(ctx, width, isPortrait);

    // 7. Portrait Orientation Guidance Note (Non-blocking)
    if (isPortrait) {
      this.renderPortraitNotice(ctx, width, height);
    }
  }

  private renderAtmosphere(ctx: CanvasRenderingContext2D, width: number, height: number, _isPortrait: boolean) {
    // Deep warm hermitage background
    const grad = ctx.createRadialGradient(width / 2, height * 0.35, 30, width / 2, height * 0.5, Math.max(width, height));
    grad.addColorStop(0, '#2e1205');
    grad.addColorStop(0.55, '#170903');
    grad.addColorStop(1, '#0c0502');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Temple Archway Motif across the top
    ctx.save();
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.arc(x + 30, 78, 28, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();

    // Marigold Garland Drapes at the top
    ctx.save();
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.35)';
    ctx.lineWidth = 3;
    for (let x = 0; x < width; x += 70) {
      ctx.beginPath();
      ctx.arc(x + 35, 78, 32, 0, Math.PI);
      ctx.stroke();
      // Little marigold flower dots
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x + 35, 110, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Burning Brass Diyas with warm flickering flame halos
    this.drawDiya(ctx, 42, height - 55, 1.1);
    this.drawDiya(ctx, width - 42, height - 55, 1.1);
    if (width > 650) {
      this.drawDiya(ctx, 45, 140, 0.85);
      this.drawDiya(ctx, width - 45, 140, 0.85);
    }
  }

  private drawDiya(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const flicker = 0.85 + Math.sin(this.time * 6 + x) * 0.15;
    const glow = ctx.createRadialGradient(0, -12, 2, 0, -12, 38 * flicker);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
    glow.addColorStop(0.5, 'rgba(234, 88, 12, 0.18)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -12, 38 * flicker, 0, Math.PI * 2);
    ctx.fill();

    // Brass bowl
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 8, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flame
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(7, -8, 0, -19 * flicker);
    ctx.quadraticCurveTo(-7, -8, 0, 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render Sage Vyasa and Lord Ganesha (Large, Central Visual Focus)
   */
  private renderCharacters(ctx: CanvasRenderingContext2D, width: number, height: number, isPortrait: boolean) {
    ctx.save();

    let vyasaX: number;
    let vyasaY: number;
    let vyasaScale: number;

    let ganeshaX: number;
    let ganeshaY: number;
    let ganeshaScale: number;

    if (isPortrait) {
      // Portrait: Ganesha is in the UPPER CENTER (Prominent & visually dominant!)
      ganeshaScale = Math.min(1.45, Math.max(1.1, width / 340));
      ganeshaX = width * 0.62;
      ganeshaY = height * 0.22;

      // Vyasa seated respectfully to the left
      vyasaScale = ganeshaScale * 0.72;
      vyasaX = width * 0.20;
      vyasaY = height * 0.24;
    } else {
      // Landscape: Ganesha is large and seated directly at the right/mid-right behind the manuscript desk!
      ganeshaScale = Math.min(1.5, Math.max(1.05, height / 540));
      ganeshaX = width > 900 ? width * 0.76 : width * 0.78;
      ganeshaY = height * 0.44;

      // Vyasa seated on the left dictating
      vyasaScale = Math.min(1.15, Math.max(0.85, height / 640));
      vyasaX = Math.max(90, width * 0.16);
      vyasaY = height * 0.48;
    }

    // Draw Sage Vyasa
    this.drawVyasa(ctx, vyasaX, vyasaY, vyasaScale);

    // Draw Lord Ganesha (The main protagonist!)
    this.drawGanesha(ctx, ganeshaX, ganeshaY, ganeshaScale);

    // Dictation Flow Rays flowing from Vyasa to Manuscript
    this.drawDictationFlow(ctx, vyasaX, vyasaY, ganeshaX, ganeshaY, isPortrait, width, height);

    // Vyasa Speech Bubble Dialogue
    if (this.vyasaDialogueTimer > 0 && this.vyasaDialogueText) {
      this.drawVyasaSpeechBubble(ctx, vyasaX, vyasaY - 60 * vyasaScale, this.vyasaDialogueText);
    }

    ctx.restore();
  }

  private drawVyasa(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const breathe = Math.sin(this.vyasaGestureCycle) * 2;
    const handLift = Math.sin(this.vyasaGestureCycle * 1.6) * 5;

    // Kusha grass mat cushion
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 48, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Saffron ascetic body
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 32 + breathe * 0.5, 27, 21, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rudraksha mala necklace
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 18, 13, 0, Math.PI);
    ctx.stroke();

    // Ascetic Head
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(0, 4 + breathe, 14, 0, Math.PI * 2);
    ctx.fill();

    // Flowing white beard
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-10, 8 + breathe);
    ctx.quadraticCurveTo(0, 38 + breathe, 10, 8 + breathe);
    ctx.fill();

    // Topknot (Jata)
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, -11 + breathe, 9, 0, Math.PI * 2);
    ctx.fill();

    // Red Tilak
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-1.5, -3 + breathe, 3, 7);

    // Right Arm in Dictation Gesture
    ctx.strokeStyle = '#fcd34d';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(12, 20 + breathe);
    ctx.quadraticCurveTo(24, 10 + handLift, 22, -2 + handLift);
    ctx.stroke();

    // Hand in Jnana mudra
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(22, -3 + handLift, 5, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText('SAGE VYASA', 0, 68);
    ctx.font = 'italic 9px Outfit, sans-serif';
    ctx.fillStyle = this.isSpeedChallenge ? '#fbbf24' : '#f59e0b';
    ctx.fillText(this.isSpeedChallenge ? '⚡ Dictating Fast!' : 'Dictating...', 0, 80);

    ctx.restore();
  }

  private drawVyasaSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
    ctx.save();
    ctx.font = 'bold 11px Outfit, sans-serif';
    const textW = ctx.measureText(text).width;
    const pad = 12;
    const bubbleW = Math.min(260, textW + pad * 2);
    const bubbleH = 34;
    const bx = x - bubbleW / 2;
    const by = y - bubbleH;

    // Speech bubble container
    ctx.fillStyle = 'rgba(254, 243, 199, 0.95)';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 10);
    ctx.fill();
    ctx.stroke();

    // Downward arrow pointer
    ctx.fillStyle = 'rgba(254, 243, 199, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x - 5, by + bubbleH);
    ctx.lineTo(x + 5, by + bubbleH);
    ctx.lineTo(x, by + bubbleH + 6);
    ctx.closePath();
    ctx.fill();

    // Bubble text
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, by + 21);
    ctx.restore();
  }

  private drawGanesha(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const isActivelyWriting = !this.isGameOver && (this.ganeshaWritingSpeed > 0.05 || this.passageCompleteAnim > 0);
    const writeOffset = isActivelyWriting
      ? Math.sin(this.ganeshaWritingCycle * 6) * Math.min(6, 2 + this.ganeshaWritingSpeed * 1.4)
      : 0;
    const earFlap = Math.sin(this.time * 2) * 2.5;

    // Aura / Glow when high combo or tusk empowered
    if (this.combo >= 4 || this.tuskEmpowered || this.passageCompleteAnim > 0) {
      const auraGlow = ctx.createRadialGradient(0, 15, 10, 0, 15, 65);
      auraGlow.addColorStop(0, this.tuskEmpowered ? 'rgba(251, 191, 36, 0.35)' : 'rgba(245, 158, 11, 0.25)');
      auraGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGlow;
      ctx.beginPath();
      ctx.arc(0, 15, 65, 0, Math.PI * 2);
      ctx.fill();
    }

    // Divine Royal Lotus Asana
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.ellipse(0, 52, 42, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(0, 50, 36, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ganesha Golden Body (Seated gracefully)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 32, 30, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Silk yellow dhoti
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(0, 42, 28, 13, 0, 0, Math.PI);
    ctx.fill();

    // Divine Elephant Ears (Animated Flapping)
    ctx.fillStyle = '#fbbf24';
    // Left ear
    ctx.beginPath();
    ctx.ellipse(-24 - earFlap, 6, 14, 18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.ellipse(24 + earFlap, 6, 14, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Elephant Head
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 6, 20, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Trunk (Animated gently)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    const trunkCurl = Math.sin(this.time * 1.8) * 3;
    ctx.quadraticCurveTo(-6, 26, -14 + trunkCurl, 31);
    ctx.stroke();

    // Sacred Red Tilak on forehead
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-2.5, -4, 5, 10);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Golden Crown (Mukut)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.lineTo(0, -30);
    ctx.lineTo(16, -8);
    ctx.closePath();
    ctx.fill();

    // Crown Ruby Jewel
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -17, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Tusk representation
    if (this.tuskEmpowered) {
      // Broken tusk on right side, golden capped
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.ellipse(12, 14, 4, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(10, 13, 3.5, 3.5);
    } else {
      // Intact ivory tusk
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(11, 12);
      ctx.lineTo(18, 21);
      ctx.lineTo(13, 22);
      ctx.closePath();
      ctx.fill();
    }

    // Left Tusk (Intact)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-11, 12);
    ctx.lineTo(-18, 21);
    ctx.lineTo(-13, 22);
    ctx.closePath();
    ctx.fill();

    // Right Arm Writing on Manuscript (Active Writing Motion!)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(18, 22);
    ctx.quadraticCurveTo(30, 26 + writeOffset, 24, 40 + writeOffset);
    ctx.stroke();

    // Writing Instrument: Reed Stylus OR Glowing Sacred Broken Tusk!
    if (this.tuskEmpowered) {
      // Radiant Golden Ivory Tusk!
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(24, 40 + writeOffset);
      ctx.lineTo(14, 52 + writeOffset);
      ctx.stroke();

      // Sparkling golden celestial tip
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(14, 52 + writeOffset, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sacred Reed Stylus
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(24, 40 + writeOffset);
      ctx.lineTo(16, 48 + writeOffset);
      ctx.stroke();
    }

    // Hero Label
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText('LORD GANESHA', 0, 75);
    ctx.font = 'bold 9px Outfit, sans-serif';
    if (this.isGameOver) {
      ctx.fillStyle = this.isCompleted ? '#34d399' : '#ef4444';
      ctx.fillText(this.isCompleted ? 'Mahabharata Inscribed! 📜' : 'Writing Stopped (Time Expired)', 0, 87);
    } else if (this.passageCompleteAnim > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Verse Inscribed! 📜', 0, 87);
    } else if (this.ganeshaWritingSpeed > 0.2) {
      ctx.fillStyle = this.tuskEmpowered ? '#fbbf24' : '#f59e0b';
      ctx.fillText(this.tuskEmpowered ? 'Writing with Sacred Tusk ⚡' : 'Writing Swiftly 🖋️', 0, 87);
    } else {
      ctx.fillStyle = '#fed7aa';
      ctx.fillText('Listening to Sage Vyasa...', 0, 87);
    }

    ctx.restore();
  }

  private drawDictationFlow(
    ctx: CanvasRenderingContext2D,
    vyasaX: number,
    vyasaY: number,
    _ganeshaX: number,
    _ganeshaY: number,
    _isPortrait: boolean,
    width: number,
    height: number
  ) {
    const targetX = width / 2;
    const targetY = height * 0.44;

    ctx.save();
    const waveCount = this.isSpeedChallenge ? 6 : 3;
    for (let i = 0; i < waveCount; i++) {
      const progress = ((this.time * (this.isSpeedChallenge ? 1.4 : 0.7) + i * 0.3) % 1);
      const wx = vyasaX + (targetX - vyasaX) * progress;
      const wy = vyasaY + (targetY - vyasaY) * progress + Math.sin(progress * Math.PI) * -22;

      ctx.fillStyle = this.isSpeedChallenge ? 'rgba(251, 191, 36, 0.75)' : 'rgba(245, 158, 11, 0.45)';
      ctx.beginPath();
      ctx.arc(wx, wy, (1 - progress) * (this.isSpeedChallenge ? 6 : 4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Render the Central Ancient Palm-Leaf Manuscript (Talapatra)
   */
  private renderManuscript(ctx: CanvasRenderingContext2D, width: number, height: number, isPortrait: boolean) {
    ctx.save();

    let scrollX: number;
    let scrollY: number;
    let scrollW: number;
    let scrollH: number;

    if (isPortrait) {
      scrollW = Math.min(width - 24, 440);
      scrollH = Math.min(height * 0.50, 390);
      scrollX = (width - scrollW) / 2;
      scrollY = height * 0.37;
    } else {
      scrollW = Math.min(width * 0.58, 760);
      scrollH = Math.min(height * 0.62, 430);
      scrollX = (width - scrollW) / 2;
      scrollY = Math.max(82, (height - scrollH) / 2 + 10);
    }

    // Visual Stack of Palm Leaves Underneath (Tangible depth!)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(scrollX - 4, scrollY + 5, scrollW + 8, scrollH, 16);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.roundRect(scrollX - 2, scrollY + 3, scrollW + 4, scrollH, 16);
    ctx.fill();

    // Page-Turn Curl Transition Animation
    const pageCurlOffset = this.pageTurnAnim * 18;

    // Active Palm Leaf Scroll Body
    const palmGrad = ctx.createLinearGradient(scrollX, scrollY, scrollX + scrollW, scrollY + scrollH);
    palmGrad.addColorStop(0, '#fef3c7');
    palmGrad.addColorStop(0.5, '#fde68a');
    palmGrad.addColorStop(1, '#fbd38d');
    ctx.fillStyle = palmGrad;
    ctx.beginPath();
    ctx.roundRect(scrollX, scrollY - pageCurlOffset, scrollW, scrollH, 18);
    ctx.fill();

    // Aged scroll borders
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(scrollX + 6, scrollY + 6 - pageCurlOffset, scrollW - 12, scrollH - 12, 14);
    ctx.stroke();

    // Subtle horizontal palm leaf fibers
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.1)';
    ctx.lineWidth = 1;
    for (let y = scrollY + 22; y < scrollY + scrollH - 22; y += 14) {
      ctx.beginPath();
      ctx.moveTo(scrollX + 16, y - pageCurlOffset);
      ctx.lineTo(scrollX + scrollW - 16, y - pageCurlOffset);
      ctx.stroke();
    }

    // Sacred red binding thread tassels
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(scrollX - 4, scrollY + 24, 5, scrollH - 48);
    ctx.fillRect(scrollX + scrollW - 1, scrollY + 24, 5, scrollH - 48);

    // --- SCROLL HEADER: Manuscript Progress Bar ---
    this.renderManuscriptHeader(ctx, scrollX, scrollY, scrollW);

    // --- DICTATED TEXT: "VYASA'S WORDS" ---
    this.renderDictatedText(ctx, scrollX, scrollY, scrollW, scrollH);

    // --- GANESHA'S WRITTEN LINE / TYPING AREA ---
    this.renderTypingInputArea(ctx, scrollX, scrollY, scrollW, scrollH);

    ctx.restore();
  }

  private renderManuscriptHeader(ctx: CanvasRenderingContext2D, scrollX: number, scrollY: number, scrollW: number) {
    const pad = 24;
    const barW = scrollW - pad * 2;
    const barH = 10;
    const barX = scrollX + pad;
    const barY = scrollY + 36;

    // Header Label & Page Counter
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'left';
    ctx.fillText(`📜 THE MAHABHARATA (Page ${this.currentPassageIndex + 1} of ${this.PASSAGES.length})`, barX, scrollY + 24);

    ctx.textAlign = 'right';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.fillText(`${this.manuscriptProgress}% COMPLETE`, barX + barW, scrollY + 24);

    // Progress Bar Background
    ctx.fillStyle = 'rgba(120, 53, 15, 0.2)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 5);
    ctx.fill();

    // Progress Bar Fill with golden sheen
    const fillW = Math.max(6, (this.manuscriptProgress / 100) * barW);
    const fillGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    fillGrad.addColorStop(0, '#d97706');
    fillGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 5);
    ctx.fill();

    // Level Title Tag
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = '#92400e';
    ctx.textAlign = 'center';
    const stageName =
      this.currentStage === 1
        ? 'LEVEL 1: BEGIN THE MANUSCRIPT'
        : this.currentStage === 2
        ? 'LEVEL 2: THE GREAT DICTATION'
        : 'LEVEL 3: THE WRITING MUST CONTINUE';
    ctx.fillText(stageName, scrollX + scrollW / 2, barY + barH + 16);
  }

  private renderDictatedText(
    ctx: CanvasRenderingContext2D,
    scrollX: number,
    scrollY: number,
    scrollW: number,
    _scrollH: number
  ) {
    const contentX = scrollX + 26;
    const contentW = scrollW - 52;
    const textStartY = scrollY + 95;

    // Header "VYASA'S WORDS"
    ctx.font = 'black 11px Cinzel, serif';
    ctx.fillStyle = '#b45309';
    ctx.textAlign = 'left';
    ctx.fillText("VYASA'S DICTATION:", contentX, textStartY);

    // Word wrap helper
    ctx.font = '600 18px "Playfair Display", Georgia, serif';
    if (window.innerWidth < 480) {
      ctx.font = '600 16px "Playfair Display", Georgia, serif';
    }

    const words = this.currentPassage.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > contentW && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Draw lines with real-time character color confirmation
    let charOffset = 0;
    let currentY = textStartY + 28;
    const lineHeight = 28;

    lines.forEach(l => {
      let currentX = contentX;

      for (let i = 0; i < l.length; i++) {
        const char = l[i];
        const globalCharIndex = charOffset + i;

        if (globalCharIndex < this.typedText.length) {
          // Correctly typed: rich confirmed ink
          ctx.fillStyle = this.tuskEmpowered ? '#92400e' : '#1e1b4b';
          ctx.font = 'bold 18px "Playfair Display", Georgia, serif';
        } else if (globalCharIndex === this.typedText.length) {
          // Active character: highlighted
          const isErrorShake = this.time - this.lastMistakeTime < 0.25;
          ctx.fillStyle = isErrorShake ? '#ef4444' : '#b45309';
          ctx.font = 'bold 20px "Playfair Display", Georgia, serif';

          // Cursor underline
          const charW = ctx.measureText(char).width;
          ctx.fillRect(currentX, currentY + 3, Math.max(charW, 8), 2.5);
        } else {
          // Remaining characters to type
          ctx.fillStyle = '#573010';
          ctx.font = '500 18px "Playfair Display", Georgia, serif';
        }

        ctx.fillText(char, currentX, currentY);
        currentX += ctx.measureText(char).width;
      }

      charOffset += l.length;
      currentY += lineHeight;
    });
  }

  private renderTypingInputArea(
    ctx: CanvasRenderingContext2D,
    scrollX: number,
    scrollY: number,
    scrollW: number,
    scrollH: number
  ) {
    const inputAreaW = scrollW - 48;
    const inputAreaH = 68;
    const inputAreaX = scrollX + 24;
    const inputAreaY = scrollY + scrollH - inputAreaH - 18;

    // Transcription Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeStyle = this.time - this.lastMistakeTime < 0.25 ? '#ef4444' : '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(inputAreaX, inputAreaY, inputAreaW, inputAreaH, 12);
    ctx.fill();
    ctx.stroke();

    // Mini Subtitle
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'left';
    ctx.fillText('GANESHA WRITES:', inputAreaX + 14, inputAreaY + 18);

    // Live Typed Transcription
    ctx.font = 'bold 18px "Playfair Display", Georgia, serif';
    ctx.fillStyle = this.tuskEmpowered ? '#b45309' : '#1e1b4b';
    const displayTyped = this.typedText.length > 0 ? this.typedText : 'Type what Vyasa dictates...';
    if (this.typedText.length === 0) {
      ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(inputAreaX + 12, inputAreaY, inputAreaW - 24, inputAreaH);
    ctx.clip();
    ctx.fillText(displayTyped, inputAreaX + 14, inputAreaY + 48);

    // Blinking cursor
    if (Math.sin(this.time * 6) > 0) {
      const typedWidth = ctx.measureText(this.typedText).width;
      ctx.fillStyle = this.tuskEmpowered ? '#f59e0b' : '#1e1b4b';
      ctx.fillRect(inputAreaX + 16 + (this.typedText.length > 0 ? typedWidth : 0), inputAreaY + 32, 2, 20);
    }
    ctx.restore();
  }

  /**
   * Render Special In-Game Overlays
   */
  private renderEventOverlays(ctx: CanvasRenderingContext2D, width: number, height: number, _isPortrait: boolean) {
    // 1. SPEED CHALLENGE BANNER
    if (this.isSpeedChallenge) {
      ctx.save();
      const bannerW = Math.min(width - 32, 420);
      const bannerH = 40;
      const bx = (width - bannerW) / 2;
      const by = 74;

      ctx.fillStyle = 'rgba(234, 88, 12, 0.95)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bannerW, bannerH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 13px Cinzel, serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ VYASA SPEED CHALLENGE (🔥 2X SCORE)', width / 2, by + 25);
      ctx.restore();
    }

    // 2. INK REFILL CHALLENGE MODAL
    if (this.isRefillingInk) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 6, 3, 0.82)';
      ctx.fillRect(0, 0, width, height);

      const modalW = Math.min(width - 32, 380);
      const modalH = 220;
      const mx = (width - modalW) / 2;
      const my = (height - modalH) / 2;

      ctx.fillStyle = '#2a1106';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(mx, my, modalW, modalH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🖋️', width / 2, my + 44);

      ctx.font = 'bold 18px Cinzel, serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('INK RUNNING LOW!', width / 2, my + 76);

      ctx.font = '13px Outfit, sans-serif';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText('Type this word quickly to refill ink:', width / 2, my + 102);

      // Word display box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(mx + 30, my + 118, modalW - 60, 48, 12);
      ctx.fill();

      // Show letters typed vs remaining
      ctx.font = 'bold 24px monospace';
      let charX = width / 2 - (this.refillTargetWord.length * 16) / 2;
      for (let i = 0; i < this.refillTargetWord.length; i++) {
        const char = this.refillTargetWord[i];
        const isTyped = i < this.refillTypedText.length;
        ctx.fillStyle = isTyped ? '#34d399' : '#fde047';
        ctx.fillText(char, charX + i * 16, my + 150);
      }

      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('Refills ink to 100% and awards bonus points', width / 2, my + 195);

      ctx.restore();
    }

    // 3. THE TUSK MOMENT CINEMATIC MODAL (Major Story Event - ONCE)
    if (this.isTuskCinematic) {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 4, 2, 0.90)';
      ctx.fillRect(0, 0, width, height);

      const tuskW = Math.min(width - 32, 450);
      const tuskH = 280;
      const tx = (width - tuskW) / 2;
      const ty = (height - tuskH) / 2;

      ctx.fillStyle = '#2c1206';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tuskW, tuskH, 24);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ 📜 ⚡', width / 2, ty + 48);

      ctx.font = 'bold 20px Cinzel, serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('THE SACRED TUSK', width / 2, ty + 84);

      ctx.font = 'italic 14px "Playfair Display", Georgia, serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('"The reed pen snapped under the intense dictation!"', width / 2, ty + 118);

      ctx.font = 'black 17px Cinzel, serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('“THE WRITING MUST NOT STOP.”', width / 2, ty + 152);

      ctx.font = '13px Outfit, sans-serif';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText('Lord Ganesha breaks his sacred ivory tusk to continue the epic.', width / 2, ty + 185);

      // Continue Button
      const btnW = 220;
      const btnH = 38;
      const bx = (width - btnW) / 2;
      const by = ty + tuskH - 56;
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 12);
      ctx.fill();

      ctx.font = 'bold 12px Cinzel, serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('CONTINUE WRITING ▶', width / 2, by + 24);

      ctx.restore();
    }

    // 4. "DID YOU KNOW?" EDUCATIONAL MODAL
    if (this.activeDidYouKnow) {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 4, 2, 0.85)';
      ctx.fillRect(0, 0, width, height);

      const dykW = Math.min(width - 32, 420);
      const dykH = 220;
      const dx = (width - dykW) / 2;
      const dy = (height - dykH) / 2;

      ctx.fillStyle = '#291106';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(dx, dy, dykW, dykH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 18px Cinzel, serif';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('📜 DID YOU KNOW?', width / 2, dy + 42);

      // Wrap didactic text
      ctx.font = '13px Outfit, sans-serif';
      ctx.fillStyle = '#fef08a';
      const words = this.activeDidYouKnow.split(' ');
      let line = '';
      let lineY = dy + 76;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > dykW - 48) {
          ctx.fillText(line, width / 2, lineY);
          line = w + ' ';
          lineY += 22;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, width / 2, lineY);

      // Dismiss Button
      const btnW = 180;
      const btnH = 36;
      const bx = (width - btnW) / 2;
      const by = dy + dykH - 52;
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 10);
      ctx.fill();

      ctx.font = 'bold 12px Cinzel, serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('CONTINUE ▶', width / 2, by + 23);

      ctx.restore();
    }
  }

  /**
   * Top HUD Bar with Countdown Timer
   */
  private renderHUD(ctx: CanvasRenderingContext2D, width: number, isPortrait: boolean) {
    ctx.save();
    const hudH = 56;
    const hudW = width - 28;
    const hudX = 14;
    const hudY = 12;

    // HUD Background
    ctx.fillStyle = 'rgba(24, 10, 5, 0.94)';
    ctx.strokeStyle = this.isTimeWarning ? '#ef4444' : '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 14);
    ctx.fill();
    ctx.stroke();

    // 1. COUNTDOWN TIMER (Crucial Game Mechanic!)
    const timeX = hudX + 16;
    ctx.textAlign = 'left';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = this.passageSecondsRemaining <= 5 ? '#ef4444' : '#fde68a';
    ctx.fillText(this.passageSecondsRemaining <= 5 ? '⚠️ TIME RUNNING OUT' : 'TIME LEFT', timeX, hudY + 20);

    ctx.font = 'bold 20px monospace';
    const timerText = `⏱️ ${this.passageSecondsRemaining}s`;
    ctx.fillStyle = this.passageSecondsRemaining <= 5
      ? (Math.sin(this.time * 10) > 0 ? '#ef4444' : '#ffffff')
      : '#ffffff';
    ctx.fillText(timerText, timeX, hudY + 44);

    // 2. SCORE
    const scoreX = hudX + (isPortrait ? 100 : 130);
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('SCORE', scoreX, hudY + 20);
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${this.score}`, scoreX, hudY + 44);

    // 3. WPM & ACCURACY
    if (!isPortrait || width > 420) {
      const wpmX = hudX + (isPortrait ? 180 : 235);
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('SPEED', wpmX, hudY + 20);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`${this.wpm} WPM`, wpmX, hudY + 44);

      const accX = hudX + (isPortrait ? 260 : 330);
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('ACCURACY', accX, hudY + 20);
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillStyle = this.accuracy >= 90 ? '#34d399' : '#f87171';
      ctx.fillText(`${this.accuracy}%`, accX, hudY + 44);
    }

    // 4. COMBO
    if (width > 680) {
      const comboX = hudX + 430;
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('COMBO', comboX, hudY + 20);
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.fillStyle = this.combo > 2 ? '#f59e0b' : '#e2e8f0';
      ctx.fillText(`🔥 x${this.combo}`, comboX, hudY + 44);
    }

    // 5. INK METER (Right Side)
    const inkW = Math.min(100, Math.max(55, hudW * 0.16));
    const inkX = hudX + hudW - inkW - 16;
    const inkY = hudY + 27;

    ctx.textAlign = 'right';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillStyle = this.inkLevel < 25 ? '#ef4444' : '#fde68a';
    ctx.fillText(this.inkLevel < 25 ? '⚠️ INK LOW' : '🪶 INK', hudX + hudW - 16, hudY + 20);

    // Ink gauge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(inkX, inkY, inkW, 10, 5);
    ctx.fill();

    const filledInkW = Math.max(2, (this.inkLevel / 100) * inkW);
    ctx.fillStyle = this.inkLevel < 25 ? '#ef4444' : (this.tuskEmpowered ? '#fbbf24' : '#38bdf8');
    ctx.beginPath();
    ctx.roundRect(inkX, inkY, filledInkW, 10, 5);
    ctx.fill();

    ctx.restore();
  }

  private renderPortraitNotice(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.font = '10px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(253, 230, 138, 0.65)';
    ctx.textAlign = 'center';
    ctx.fillText('💡 For the best experience, rotate your device to horizontal mode', width / 2, height - 12);
    ctx.restore();
  }
}
