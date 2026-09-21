/**
 * Chapter 3: Ganesha's River Crossing
 * 
 * Endless Survival + Collection Arcade Game
 * 
 * Features:
 * - Mushika hops across the sacred Kaveri river using moving platforms
 * - Moving platforms: Buoyant Lotus Pads, Carved Sandalwood Logs, Floating Marigold Barges
 * - Unlimited Modak collection across the endless river
 * - 5 Hearts system: falling into the river loses 1 heart with invincibility period
 * - Smooth difficulty curve: platforms start slow and gradually speed up
 * - Lord Ganesha is VISIBLE IN THE DISTANCE across the river throughout normal gameplay
 * - When 5th heart is lost: smooth cinematic approach to Lord Ganesha,
 *   offering all collected Modaks with golden arcing animation,
 *   joyful Ganesh Chaturthi celebration, and authentic arcade Run Complete screen!
 */

import { soundEngine } from '../../audio/soundEngine';
import { FeastGameResult, Particle } from '../../types';
import { GameStorage } from '../../utils/storage';
import { GameRenderer } from '../renderer';

export type RiverCrossingMode = 
  | 'INSTRUCTIONS'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'OFFERING_TO_GANESHA'
  | 'RUN_OVER';

export type OfferingPhase = 'APPROACH' | 'OFFERING' | 'CELEBRATION';

export interface RiverPlatform {
  id: number;
  x: number;
  width: number;
  type: 'lotus' | 'log' | 'barge';
  hasModak: boolean;
  modakCollected: boolean;
}

export interface RiverRow {
  rowIndex: number;
  y: number; // World Y position (row 0 is start bank at y=0, row 1 at y=ROW_HEIGHT, etc.)
  type: 'bank' | 'water';
  direction: 1 | -1; // 1 = right, -1 = left
  speed: number;
  platforms: RiverPlatform[];
  hasBankModaks?: { x: number; collected: boolean }[];
}

export interface FlyingModak {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number;
  speed: number;
  peakHeight: number;
  finished: boolean;
}

export class GreatRaceScene {
  // Game State
  public mode: RiverCrossingMode = 'INSTRUCTIONS';
  public hearts: number = 5;
  public maxHearts: number = 5;
  public score: number = 0;
  public modaksCollected: number = 0;
  public rowsCrossed: number = 0;
  public highestRow: number = 0;
  public timeSurvived: number = 0;
  public isInvulnerable: boolean = false;
  public invulnerableTimer: number = 0;
  public countdownTimer: number = 3.0;

  // Player (Mushika) Grid and World Positioning
  public playerGridX: number = 0; // -3 to +3 (relative columns)
  public playerGridY: number = 0; // row index (0 = starting bank)
  public playerWorldX: number = 0;
  public playerWorldY: number = 0;
  public playerFacing: 'up' | 'down' | 'left' | 'right' = 'up';

  // Hopping Animation
  public isHopping: boolean = false;
  public hopTimer: number = 0;
  public hopDuration: number = 0.16; // snappy arcade jump
  public hopStartX: number = 0;
  public hopStartY: number = 0;
  public hopTargetX: number = 0;
  public hopTargetY: number = 0;
  public hopArcY: number = 0;

  // River Layout Constants
  public readonly ROW_HEIGHT: number = 64;
  public readonly COL_WIDTH: number = 68;
  private rows: RiverRow[] = [];
  private nextRowId: number = 0;
  private nextPlatformId: number = 0;

  // Camera
  public cameraY: number = 0;
  public targetCameraY: number = 0;

  // Visual Effects & Particles
  private particles: Particle[] = [];
  private waterPetals: Array<{ x: number; y: number; speed: number; rot: number; vrot: number; color: string; size: number }> = [];
  private screenPetals: Array<{ x: number; y: number; vx: number; vy: number; rot: number; vrot: number; size: number; color: string }> = [];
  private runTime: number = 0;
  private waterFlowTime: number = 0;
  private redVignetteTimer: number = 0;

  // Ending Sequence: Offering to Lord Ganesha
  public offeringPhase: OfferingPhase = 'APPROACH';
  public offeringTimer: number = 0;
  public offeredCount: number = 0;
  public flyingModaks: FlyingModak[] = [];
  public mushikaCelebrationHopY: number = 0;
  public ganeshaApproachProgress: number = 0.0; // 0 = distant on horizon, 1 = close to Mushika

  // Callbacks
  private onGameOverCallback: (result: FeastGameResult) => void;
  private onReturnToWorldCallback?: () => void;

  // Touch Controls Active
  private touchBtnPressed: string | null = null;

  // Responsive button bounding boxes
  private instructionsStartBtn = { x: 0, y: 0, w: 0, h: 0 };
  private instructionsReturnBtn = { x: 0, y: 0, w: 0, h: 0 };
  private runOverPlayAgainBtn = { x: 0, y: 0, w: 0, h: 0 };
  private runOverReturnBtn = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    onGameOver: (result: FeastGameResult) => void,
    onReturnToWorld?: () => void
  ) {
    this.onGameOverCallback = onGameOver;
    this.onReturnToWorldCallback = onReturnToWorld;
    this.initWaterAmbience();
    this.reset();
  }

  private initWaterAmbience() {
    this.waterPetals = [];
    for (let i = 0; i < 35; i++) {
      this.waterPetals.push({
        x: Math.random() * 800,
        y: Math.random() * 1200,
        speed: 25 + Math.random() * 45,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 2,
        color: Math.random() > 0.4 ? '#f59e0b' : '#ec4899',
        size: 3 + Math.random() * 4
      });
    }
  }

  public reset() {
    this.mode = 'INSTRUCTIONS';
    this.hearts = 5;
    this.score = 0;
    this.modaksCollected = 0;
    this.rowsCrossed = 0;
    this.highestRow = 0;
    this.timeSurvived = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.countdownTimer = 3.0;

    this.playerGridX = 0;
    this.playerGridY = 0;
    this.playerWorldX = 0;
    this.playerWorldY = 0;
    this.playerFacing = 'up';

    this.isHopping = false;
    this.hopTimer = 0;
    this.hopStartX = 0;
    this.hopStartY = 0;
    this.hopTargetX = 0;
    this.hopTargetY = 0;
    this.hopArcY = 0;

    this.cameraY = 0;
    this.targetCameraY = 0;
    this.particles = [];
    this.screenPetals = [];
    this.runTime = 0;
    this.waterFlowTime = 0;
    this.redVignetteTimer = 0;

    this.offeringPhase = 'APPROACH';
    this.offeringTimer = 0;
    this.offeredCount = 0;
    this.flyingModaks = [];
    this.mushikaCelebrationHopY = 0;
    this.ganeshaApproachProgress = 0.0;

    soundEngine.stopRiverAmbience();

    // Generate initial river rows
    this.rows = [];
    this.nextRowId = 0;
    this.nextPlatformId = 0;

    // Row 0: Starting Bank
    this.generateRow(0, 'bank');

    // Generate first 28 rows ahead so river stretches high up to the horizon
    for (let r = 1; r <= 28; r++) {
      // Banks every 5-6 rows for strategic resting and festive ghats
      const isBank = (r % 5 === 0);
      this.generateRow(r, isBank ? 'bank' : 'water');
    }
  }

  public cleanUp() {
    soundEngine.stopRiverAmbience();
  }

  public startCountdown() {
    this.mode = 'COUNTDOWN';
    this.countdownTimer = 3.0;
    soundEngine.startRiverAmbience();
    soundEngine.playCountdownBeep(3);
  }

  /**
   * Procedural River Row Generator
   */
  private generateRow(rowIndex: number, type: 'bank' | 'water') {
    const y = rowIndex * this.ROW_HEIGHT;

    if (type === 'bank') {
      const bankModaks: { x: number; collected: boolean }[] = [];
      // Occasionally place 1-2 modaks on safe banks
      if (rowIndex > 0) {
        const modakCols = [-1, 0, 1];
        const chosenCol = modakCols[Math.floor(Math.random() * modakCols.length)];
        bankModaks.push({ x: chosenCol * this.COL_WIDTH, collected: false });
      }

      this.rows.push({
        rowIndex,
        y,
        type: 'bank',
        direction: 1,
        speed: 0,
        platforms: [],
        hasBankModaks: bankModaks
      });
      return;
    }

    // Water row with moving platforms
    // Alternate directions for classic engaging river flow
    const direction: 1 | -1 = (rowIndex % 2 === 0) ? 1 : -1;

    // Base speed starts slow (easy early game) and scales with difficulty
    // Starting base speed ~ 45-75 px/s
    const speedVariation = 45 + (rowIndex % 4) * 12;

    // Platform generation
    const platforms: RiverPlatform[] = [];
    const riverWidth = 720;
    const numPlatforms = 3 + (rowIndex % 2); // 3 to 4 platforms per lane for plenty of landing spots
    const spacing = riverWidth / numPlatforms;

    for (let i = 0; i < numPlatforms; i++) {
      const pX = -riverWidth / 2 + i * spacing + (Math.random() - 0.5) * 30;
      // Cycle through platform varieties: lotus pads, sandalwood logs, marigold barges
      const typeSelector = (rowIndex + i) % 3;
      let pType: 'lotus' | 'log' | 'barge' = 'lotus';
      let pWidth = 76;

      if (typeSelector === 0) {
        pType = 'lotus';
        pWidth = 78;
      } else if (typeSelector === 1) {
        pType = 'log';
        pWidth = 115;
      } else {
        pType = 'barge';
        pWidth = 145;
      }

      // 40% chance of sparkling Modak on platform!
      const hasModak = Math.random() < 0.45;

      platforms.push({
        id: ++this.nextPlatformId,
        x: pX,
        width: pWidth,
        type: pType,
        hasModak,
        modakCollected: false
      });
    }

    this.rows.push({
      rowIndex,
      y,
      type: 'water',
      direction,
      speed: speedVariation,
      platforms
    });
  }

  /**
   * Handle Player Hop (WASD / Arrows / Touch)
   */
  public handleHop(direction: 'up' | 'down' | 'left' | 'right') {
    if (this.mode !== 'PLAYING' || this.isHopping) return;

    let targetGridX = this.playerGridX;
    let targetGridY = this.playerGridY;

    if (direction === 'up') {
      targetGridY += 1;
      this.playerFacing = 'up';
    } else if (direction === 'down') {
      if (targetGridY > 0) targetGridY -= 1;
      this.playerFacing = 'down';
    } else if (direction === 'left') {
      if (targetGridX > -4) targetGridX -= 1;
      this.playerFacing = 'left';
    } else if (direction === 'right') {
      if (targetGridX < 4) targetGridX += 1;
      this.playerFacing = 'right';
    }

    // Start Parabolic Hop Animation
    this.isHopping = true;
    this.hopTimer = 0;
    this.hopStartX = this.playerWorldX;
    this.hopStartY = this.playerWorldY;
    this.playerGridX = targetGridX;
    this.playerGridY = targetGridY;
    this.hopTargetX = targetGridX * this.COL_WIDTH;
    this.hopTargetY = targetGridY * this.ROW_HEIGHT;

    soundEngine.playHop();

    // Track rows crossed and score bonus for progression
    if (targetGridY > this.highestRow) {
      const rowGain = targetGridY - this.highestRow;
      this.highestRow = targetGridY;
      this.rowsCrossed += rowGain;
      this.score += rowGain * 10;
    }

    // Generate new rows ahead if getting close to top
    const maxExistingRow = this.rows[this.rows.length - 1]?.rowIndex || 0;
    if (targetGridY + 18 > maxExistingRow) {
      for (let r = maxExistingRow + 1; r <= maxExistingRow + 14; r++) {
        const isBank = (r % 5 === 0);
        this.generateRow(r, isBank ? 'bank' : 'water');
      }
    }
  }

  /**
   * Pointer / Touch Interaction
   */
  public handlePointerDown(clientX: number, clientY: number, screenW: number, screenH: number) {
    if (this.mode === 'INSTRUCTIONS') {
      // Check Start Button
      const { x: sx, y: sy, w: sw, h: sh } = this.instructionsStartBtn;
      if (clientX >= sx && clientX <= sx + sw && clientY >= sy && clientY <= sy + sh) {
        soundEngine.playClick();
        this.startCountdown();
        return;
      }

      // Check Return to World Button
      const { x: rx, y: ry, w: rw, h: rh } = this.instructionsReturnBtn;
      if (clientX >= rx && clientX <= rx + rw && clientY >= ry && clientY <= ry + rh) {
        soundEngine.playClick();
        if (this.onReturnToWorldCallback) {
          this.onReturnToWorldCallback();
        }
        return;
      }
      return;
    }

    if (this.mode === 'RUN_OVER') {
      // Play Again
      const { x: px, y: py, w: pw, h: ph } = this.runOverPlayAgainBtn;
      if (clientX >= px && clientX <= px + pw && clientY >= py && clientY <= py + ph) {
        soundEngine.playClick();
        this.reset();
        this.startCountdown();
        return;
      }

      // Return to World
      const { x: rx, y: ry, w: rw, h: rh } = this.runOverReturnBtn;
      if (clientX >= rx && clientX <= rx + rw && clientY >= ry && clientY <= ry + rh) {
        soundEngine.playClick();
        if (this.onReturnToWorldCallback) {
          this.onReturnToWorldCallback();
        }
        return;
      }
      return;
    }

    if (this.mode === 'PLAYING') {
      // Virtual On-Screen Arcade D-Pad Buttons (Bottom 170px of screen)
      const dpadCenterY = screenH - 85;
      const dpadCenterX = screenW / 2;
      const btnRadius = 32;

      // UP button (central leap forward)
      if (Math.hypot(clientX - dpadCenterX, clientY - (dpadCenterY - 42)) < btnRadius * 1.3) {
        this.touchBtnPressed = 'up';
        this.handleHop('up');
        return;
      }
      // LEFT button
      if (Math.hypot(clientX - (dpadCenterX - 75), clientY - dpadCenterY) < btnRadius * 1.2) {
        this.touchBtnPressed = 'left';
        this.handleHop('left');
        return;
      }
      // RIGHT button
      if (Math.hypot(clientX - (dpadCenterX + 75), clientY - dpadCenterY) < btnRadius * 1.2) {
        this.touchBtnPressed = 'right';
        this.handleHop('right');
        return;
      }
      // DOWN button
      if (Math.hypot(clientX - dpadCenterX, clientY - (dpadCenterY + 42)) < btnRadius * 1.2) {
        this.touchBtnPressed = 'down';
        this.handleHop('down');
        return;
      }

      // Intuitive screen tap zone:
      // Tapping top 65% of screen hops forward
      if (clientY < screenH * 0.65) {
        if (clientX < screenW * 0.28) {
          this.handleHop('left');
        } else if (clientX > screenW * 0.72) {
          this.handleHop('right');
        } else {
          this.handleHop('up');
        }
      }
    }
  }

  public handlePointerUp() {
    this.touchBtnPressed = null;
  }

  /**
   * Trigger Lord Ganesha's Grand Ending Sequence when 5th heart is lost
   */
  public startEndingSequence() {
    this.mode = 'OFFERING_TO_GANESHA';
    this.offeringPhase = 'APPROACH';
    this.offeringTimer = 0;
    this.offeredCount = 0;
    this.flyingModaks = [];
    this.ganeshaApproachProgress = 0.0;
    this.isHopping = false;

    soundEngine.stopRiverAmbience();
    soundEngine.playGameOver();
  }

  /**
   * Primary Game Loop Update
   */
  public update(dt: number, width: number, height: number) {
    this.runTime += dt;
    this.waterFlowTime += dt;

    // Red Vignette damage flash decay
    if (this.redVignetteTimer > 0) {
      this.redVignetteTimer = Math.max(0, this.redVignetteTimer - dt);
    }

    // Invulnerability timer decay
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Update floating water petals
    for (const wp of this.waterPetals) {
      wp.x += wp.speed * dt * 0.5;
      wp.rot += wp.vrot * dt;
      if (wp.x > width + 50) {
        wp.x = -50;
        wp.y = Math.random() * (height + 400);
      }
    }

    // Update active visual particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Mode-specific updates
    switch (this.mode) {
      case 'INSTRUCTIONS':
        break;

      case 'COUNTDOWN': {
        const prevSec = Math.ceil(this.countdownTimer);
        this.countdownTimer -= dt;
        const newSec = Math.ceil(this.countdownTimer);

        if (newSec !== prevSec && newSec >= 1) {
          soundEngine.playCountdownBeep(newSec);
        }

        if (this.countdownTimer <= 0) {
          soundEngine.playCountdownBeep('GO');
          this.mode = 'PLAYING';
        }
        break;
      }

      case 'PLAYING': {
        this.timeSurvived += dt;

        // Progressive Difficulty Curve:
        // Starts slow and gradually increases with survival time and rows crossed
        // Smooth scaling: speedMultiplier starts at 1.0, ramps up smoothly to ~2.6
        const speedMultiplier = 1.0 + Math.min(1.8, (this.timeSurvived * 0.015) + (this.highestRow * 0.008));

        // Update River Rows & Moving Platforms
        const wrapBounds = Math.max(480, width / 2 + 160);
        for (const row of this.rows) {
          if (row.type === 'water') {
            const rowSpeed = row.speed * speedMultiplier * row.direction;
            for (const plat of row.platforms) {
              plat.x += rowSpeed * dt;

              // Wrap horizontally around the river width
              if (row.direction > 0 && plat.x > wrapBounds) {
                plat.x = -wrapBounds;
              } else if (row.direction < 0 && plat.x < -wrapBounds) {
                plat.x = wrapBounds;
              }
            }
          }
        }

        // Update Mushika Hopping Physics
        if (this.isHopping) {
          this.hopTimer += dt;
          const t = Math.min(1, this.hopTimer / this.hopDuration);

          // Linear interpolation for X and Y
          this.playerWorldX = this.hopStartX + (this.hopTargetX - this.hopStartX) * t;
          this.playerWorldY = this.hopStartY + (this.hopTargetY - this.hopStartY) * t;

          // Parabolic jump arc
          this.hopArcY = -Math.sin(t * Math.PI) * 22;

          if (t >= 1) {
            this.isHopping = false;
            this.playerWorldX = this.hopTargetX;
            this.playerWorldY = this.hopTargetY;
            this.hopArcY = 0;

            // Landing check! Check platform support or water splash
            this.checkLanding();
          }
        } else {
          // If resting on a platform in a water row, ride with the platform!
          const currentRow = this.rows.find(r => r.rowIndex === this.playerGridY);
          if (currentRow && currentRow.type === 'water') {
            // Find supporting platform
            const supportingPlat = currentRow.platforms.find(p => {
              const halfW = p.width / 2 + 14;
              return Math.abs(this.playerWorldX - p.x) <= halfW;
            });

            if (supportingPlat) {
              const rowSpeed = currentRow.speed * speedMultiplier * currentRow.direction;
              this.playerWorldX += rowSpeed * dt;
              // Keep grid X updated smoothly
              this.playerGridX = Math.round(this.playerWorldX / this.COL_WIDTH);

              // Check if platform carried player off the screen edge
              if (Math.abs(this.playerWorldX) > wrapBounds - 20) {
                this.handleWaterFall();
              }
            } else {
              // Not on any platform while in water row!
              this.handleWaterFall();
            }
          }

          // Continuously check Modak collection in current position
          this.checkModakCollection();
        }

        // Camera smoothly follows player Y
        // Mushika rests near the bottom of the screen (at ~78% screen height),
        // with the river, platforms, and path smoothly moving downward as he moves forward
        this.targetCameraY = this.playerWorldY;
        this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, dt * 9.5);
        break;
      }

      case 'OFFERING_TO_GANESHA': {
        this.offeringTimer += dt;

        // Phase 1: APPROACH
        // Lord Vinayakudu's Grand Mandap smoothly approaches Mushika from the distant horizon
        if (this.offeringPhase === 'APPROACH') {
          this.ganeshaApproachProgress = Math.min(1, this.offeringTimer / 1.5);

          // Mushika aligns reverently facing forward
          this.playerFacing = 'up';

          if (this.offeringTimer >= 1.6) {
            this.offeringPhase = 'OFFERING';
            this.offeringTimer = 0;
            soundEngine.playTempleBell(1.2);
            this.initOfferingModaks(width, height);
          }
        }

        // Phase 2: OFFERING
        // All collected Modaks fly in golden arcs toward Vinayakudu's golden Pooja Thali
        else if (this.offeringPhase === 'OFFERING') {
          let allDone = true;
          for (const fm of this.flyingModaks) {
            if (!fm.finished) {
              allDone = false;
              fm.progress += dt * fm.speed;

              // Parabolic trajectory
              fm.currentX = fm.startX + (fm.targetX - fm.startX) * Math.min(1, fm.progress);
              const linearY = fm.startY + (fm.targetY - fm.startY) * Math.min(1, fm.progress);
              const arc = -Math.sin(Math.min(1, fm.progress) * Math.PI) * fm.peakHeight;
              fm.currentY = linearY + arc;

              if (fm.progress >= 1) {
                fm.finished = true;
                this.offeredCount++;
                soundEngine.playCollectFood(this.offeredCount);

                // Golden burst at Vinayakudu's Thali
                for (let k = 0; k < 8; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const spd = 40 + Math.random() * 80;
                  this.particles.push({
                    x: fm.targetX,
                    y: fm.targetY,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 20,
                    size: 3 + Math.random() * 4,
                    color: '#f59e0b',
                    alpha: 1,
                    life: 0.5,
                    maxLife: 0.5
                  });
                }
              }
            }
          }

          if (allDone && (this.flyingModaks.length === 0 || this.offeredCount >= this.modaksCollected)) {
            this.offeringPhase = 'CELEBRATION';
            this.offeringTimer = 0;
            soundEngine.playMushikaCelebration();
            soundEngine.playTempleBell(1.4);
            this.initCelebrationPetals(width, height);
          }
        }

        // Phase 3: CELEBRATION
        // Joyful Ganesh Chaturthi celebration with flower petal shower & divine radiance
        else if (this.offeringPhase === 'CELEBRATION') {
          // Mushika does joyful celebratory hops
          this.mushikaCelebrationHopY = -Math.abs(Math.sin(this.offeringTimer * 9)) * 14;

          // Update falling flower petals
          for (const sp of this.screenPetals) {
            sp.y += sp.vy * dt;
            sp.x += sp.vx * dt + Math.sin(this.runTime * 3 + sp.y * 0.05) * 1.2;
            sp.rot += sp.vrot * dt;
            if (sp.y > height + 20) {
              sp.y = -20;
              sp.x = Math.random() * width;
            }
          }

          // Transition to final Run Over screen after celebration
          if (this.offeringTimer >= 3.2) {
            console.log('[GAME OVER] great_race', { score: this.score });
            this.mode = 'RUN_OVER';

            // Record high score
            const { isNewBest, previousBest } = GameStorage.recordChapterScore('great_race', this.score);
            const result: FeastGameResult = {
              chapterId: 'great_race',
              score: this.score,
              foodCollected: this.modaksCollected,
              bestCombo: this.highestRow,
              timeSurvivedSeconds: Math.floor(this.timeSurvived),
              isNewBest,
              previousBest
            };
            console.log('[CALLBACK] great_race', result);
            this.onGameOverCallback(result);
          }
        }
        break;
      }

      case 'RUN_OVER': {
        // Continue gentle petal drift in background
        for (const sp of this.screenPetals) {
          sp.y += sp.vy * dt;
          sp.x += sp.vx * dt;
          sp.rot += sp.vrot * dt;
          if (sp.y > height + 20) {
            sp.y = -20;
            sp.x = Math.random() * width;
          }
        }
        break;
      }
    }
  }

  /**
   * Check landing support when hop completes
   */
  private checkLanding() {
    const currentRow = this.rows.find(r => r.rowIndex === this.playerGridY);
    if (!currentRow) return;

    if (currentRow.type === 'bank') {
      // Safe riverbank / ghat!
      this.checkModakCollection();
      return;
    }

    // In water row: must land on a platform!
    const supportingPlat = currentRow.platforms.find(p => {
      const halfW = p.width / 2 + 16;
      return Math.abs(this.playerWorldX - p.x) <= halfW;
    });

    if (supportingPlat) {
      // Safe landing on platform!
      // Align with platform center smoothly
      this.playerWorldX = supportingPlat.x;
      this.playerGridX = Math.round(this.playerWorldX / this.COL_WIDTH);

      // Check if this platform has a Modak!
      if (supportingPlat.hasModak && !supportingPlat.modakCollected) {
        this.collectModak(supportingPlat.x, currentRow.y);
        supportingPlat.modakCollected = true;
      }

      // Small water landing splash ripple
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 20 + Math.random() * 40;
        this.particles.push({
          x: this.playerWorldX + Math.cos(angle) * 18,
          y: this.playerWorldY + 8,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 2 + Math.random() * 3,
          color: '#38bdf8',
          alpha: 0.8,
          life: 0.35,
          maxLife: 0.35
        });
      }
    } else {
      // Missed all platforms! Fall in water!
      this.handleWaterFall();
    }
  }

  /**
   * Handle Water Falling: Lose 1 Heart with Invulnerability and Safe Respawn
   */
  private handleWaterFall() {
    if (this.isInvulnerable || this.mode !== 'PLAYING') return;

    this.hearts--;
    this.redVignetteTimer = 0.5;
    this.isInvulnerable = true;
    this.invulnerableTimer = 1.8; // Safe invulnerability window

    soundEngine.playWaterSplash();
    soundEngine.playObstacleHit();

    // Large water splash explosion
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 1.2) + Math.random() * (Math.PI * 0.6);
      const spd = 70 + Math.random() * 140;
      this.particles.push({
        x: this.playerWorldX,
        y: this.playerWorldY,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 6,
        color: Math.random() > 0.3 ? '#38bdf8' : '#e0f2fe',
        alpha: 0.95,
        life: 0.65,
        maxLife: 0.65
      });
    }

    // Check if 5th heart is lost -> Game stops, trigger Lord Ganesha's ending sequence!
    if (this.hearts <= 0) {
      this.hearts = 0;
      this.startEndingSequence();
      return;
    }

    // Safe Respawn: place Mushika safely onto the nearest platform or nearest safe bank
    const currentRow = this.rows.find(r => r.rowIndex === this.playerGridY);
    if (currentRow && currentRow.type === 'water' && currentRow.platforms.length > 0) {
      // Find closest platform in this row
      let closestPlat = currentRow.platforms[0];
      let closestDist = Math.abs(this.playerWorldX - closestPlat.x);
      for (const p of currentRow.platforms) {
        const dist = Math.abs(this.playerWorldX - p.x);
        if (dist < closestDist) {
          closestDist = dist;
          closestPlat = p;
        }
      }
      this.playerWorldX = closestPlat.x;
      this.playerGridX = Math.round(this.playerWorldX / this.COL_WIDTH);
    } else {
      // Respawn to starting bank or closest safe bank below
      let safeRowIndex = 0;
      for (let r = this.playerGridY; r >= 0; r--) {
        const row = this.rows.find(rw => rw.rowIndex === r);
        if (row && row.type === 'bank') {
          safeRowIndex = r;
          break;
        }
      }
      this.playerGridY = safeRowIndex;
      this.playerWorldY = safeRowIndex * this.ROW_HEIGHT;
      this.playerGridX = 0;
      this.playerWorldX = 0;
    }
  }

  /**
   * Check Modak Collection on current row
   */
  private checkModakCollection() {
    const currentRow = this.rows.find(r => r.rowIndex === this.playerGridY);
    if (!currentRow) return;

    if (currentRow.type === 'bank' && currentRow.hasBankModaks) {
      for (const bm of currentRow.hasBankModaks) {
        if (!bm.collected && Math.abs(this.playerWorldX - bm.x) < 36) {
          bm.collected = true;
          this.collectModak(bm.x, currentRow.y);
        }
      }
    }
  }

  /**
   * Collect Modak: Unlimited collection, sound, score, sparkle burst
   */
  private collectModak(x: number, y: number) {
    this.modaksCollected++;
    this.score += 50;
    soundEngine.playCollectFood(Math.min(6, this.modaksCollected));

    // Sparkling golden burst
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 90;
      this.particles.push({
        x,
        y: y - 10,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 15,
        size: 3 + Math.random() * 4,
        color: '#fbbf24',
        alpha: 1,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  /**
   * Initialize Flying Modaks for Lord Ganesha's Offering
   */
  private initOfferingModaks(screenW: number, screenH: number) {
    this.flyingModaks = [];
    const count = Math.max(1, this.modaksCollected);
    const startX = screenW / 2;
    const startY = screenH * 0.72;
    const targetX = screenW / 2;
    const targetY = screenH * 0.36; // Vinayakudu's Golden Pooja Thali

    for (let i = 0; i < count; i++) {
      this.flyingModaks.push({
        startX: startX + (Math.random() - 0.5) * 30,
        startY: startY + (Math.random() - 0.5) * 20,
        targetX: targetX + (Math.random() - 0.5) * 40,
        targetY: targetY + (Math.random() - 0.5) * 20,
        currentX: startX,
        currentY: startY,
        progress: -i * 0.12, // Staggered arcing flights
        speed: 1.6,
        peakHeight: 65 + Math.random() * 35,
        finished: false
      });
    }
  }

  /**
   * Initialize Celebration Shower of Petals
   */
  private initCelebrationPetals(screenW: number, screenH: number) {
    this.screenPetals = [];
    for (let i = 0; i < 60; i++) {
      this.screenPetals.push({
        x: Math.random() * screenW,
        y: -20 - Math.random() * screenH,
        vx: (Math.random() - 0.5) * 60,
        vy: 70 + Math.random() * 90,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 3,
        size: 4 + Math.random() * 6,
        color: Math.random() > 0.5 ? '#f59e0b' : (Math.random() > 0.5 ? '#ec4899' : '#f43f5e')
      });
    }
  }

  /**
   * Primary Render Pipeline
   */
  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // 1. Festive River Background & Atmosphere
    this.renderRiverBackground(ctx, width, height);

    // 2. Render River Rows & Floating Platforms (in world coordinates offset by camera)
    ctx.save();
    // Mushika sits near bottom of screen (78% height), revealing all upcoming river platforms ahead
    const originScreenX = width / 2;
    const originScreenY = height * 0.78 + this.cameraY;

    this.renderRiverRows(ctx, originScreenX, originScreenY, width, height);

    // 3. Render Particles in World
    this.renderWorldParticles(ctx, originScreenX, originScreenY);

    // 4. Render Mushika (Player character)
    this.renderMushika(ctx, originScreenX, originScreenY);

    ctx.restore();

    // 5. Lord Vinayakudu's Grand Mandap (Distant Horizon during gameplay, Close during Offering)
    this.renderGaneshaMandap(ctx, width, height);

    // 6. Flying Modaks during Offering to Ganesha
    if (this.mode === 'OFFERING_TO_GANESHA') {
      this.renderFlyingModaks(ctx);
    }

    // 7. Festive Falling Petals during Celebration / Run Over
    if (this.mode === 'OFFERING_TO_GANESHA' && this.offeringPhase === 'CELEBRATION' || this.mode === 'RUN_OVER') {
      this.renderScreenPetals(ctx);
    }

    // 8. Damage Red Vignette Flash
    if (this.redVignetteTimer > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(239, 68, 68, ${this.redVignetteTimer * 0.45})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 9. HUD (Hearts, Modaks, Score, Distance, Time)
    if (this.mode === 'PLAYING' || this.mode === 'COUNTDOWN') {
      this.renderHUD(ctx, width, height);
      this.renderArcadeTouchControls(ctx, width, height);
    }

    // 10. Countdown Banner (3, 2, 1, HOP!)
    if (this.mode === 'COUNTDOWN') {
      this.renderCountdownOverlay(ctx, width, height);
    }

    // 11. Instructions Screen
    if (this.mode === 'INSTRUCTIONS') {
      this.renderInstructionsOverlay(ctx, width, height);
    }

    // 12. Run Over / Game Complete Screen
    if (this.mode === 'RUN_OVER') {
      this.renderRunOverOverlay(ctx, width, height);
    }
  }

  /**
   * Render River Water Background & Waves
   */
  private renderRiverBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Deep Sacred River Kaveri Gradient
    const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
    waterGrad.addColorStop(0, '#0c2438'); // distant deep water
    waterGrad.addColorStop(0.35, '#0e3a53');
    waterGrad.addColorStop(0.7, '#075985');
    waterGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, width, height);

    // Flowing Water Ripple Crests
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 2;

    const waveRows = 16;
    for (let i = 0; i < waveRows; i++) {
      const wy = (i * (height / waveRows) + (this.waterFlowTime * 18)) % height;
      const waveShift = Math.sin(this.waterFlowTime * 2 + i) * 20;
      ctx.beginPath();
      ctx.moveTo(-40, wy);
      for (let x = 0; x < width + 40; x += 60) {
        const offset = Math.sin(x * 0.04 + this.waterFlowTime * 3 + i) * 6;
        ctx.lineTo(x + waveShift, wy + offset);
      }
      ctx.stroke();
    }

    // Floating Marigold & Lotus Petals drifting in water
    for (const wp of this.waterPetals) {
      ctx.save();
      ctx.translate(wp.x, wp.y);
      ctx.rotate(wp.rot);
      ctx.fillStyle = wp.color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.ellipse(0, 0, wp.size, wp.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Render River Rows (Banks and Moving Platforms)
   */
  private renderRiverRows(
    ctx: CanvasRenderingContext2D,
    originX: number,
    originY: number,
    screenWidth: number,
    screenHeight: number
  ) {
    // Only render rows currently in or near visible screen
    for (const row of this.rows) {
      const screenRowY = originY - row.y;
      if (screenRowY < -100 || screenRowY > screenHeight + 100) continue;

      if (row.type === 'bank') {
        // Render Sacred Temple Ghat / Riverbank
        this.renderBankRow(ctx, originX, screenRowY, screenWidth, row);
      } else {
        // Render Flowing Water Row & Moving Platforms
        this.renderWaterRow(ctx, originX, screenRowY, row);
      }
    }
  }

  /**
   * Render Grassy / Sandstone Temple Ghat Bank
   */
  private renderBankRow(
    ctx: CanvasRenderingContext2D,
    originX: number,
    rowScreenY: number,
    screenWidth: number,
    row: RiverRow
  ) {
    ctx.save();
    const halfH = this.ROW_HEIGHT / 2;

    // Sandstone Ghat Paver Steps
    const bankGrad = ctx.createLinearGradient(0, rowScreenY - halfH, 0, rowScreenY + halfH);
    bankGrad.addColorStop(0, '#78350f'); // rich warm sandstone
    bankGrad.addColorStop(0.2, '#92400e');
    bankGrad.addColorStop(0.8, '#b45309');
    bankGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = bankGrad;
    ctx.fillRect(0, rowScreenY - halfH, screenWidth, this.ROW_HEIGHT);

    // Stone paver outline borders
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, rowScreenY - halfH, screenWidth, this.ROW_HEIGHT);

    // Festive Marigold Border Garlands along the edge
    const garlandCount = Math.ceil(screenWidth / 28);
    for (let i = 0; i < garlandCount; i++) {
      const gx = i * 28 + 14;
      ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#ea580c';
      ctx.beginPath();
      ctx.arc(gx, rowScreenY - halfH + 4, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render bank modaks if present
    if (row.hasBankModaks) {
      for (const bm of row.hasBankModaks) {
        if (!bm.collected) {
          GameRenderer.drawModakVector(ctx, originX + bm.x, rowScreenY, 18);
        }
      }
    }

    // Burning Brass Diyas on Ghat edges
    GameRenderer.drawDiya(ctx, 40, rowScreenY, 14, this.runTime);
    GameRenderer.drawDiya(ctx, screenWidth - 40, rowScreenY, 14, this.runTime);

    ctx.restore();
  }

  /**
   * Render Moving Platforms in a Water Row
   */
  private renderWaterRow(
    ctx: CanvasRenderingContext2D,
    originX: number,
    rowScreenY: number,
    row: RiverRow
  ) {
    ctx.save();

    for (const plat of row.platforms) {
      const platX = originX + plat.x;

      if (plat.type === 'lotus') {
        // 1. Sacred Emerald Lotus Leaf Pad
        const leafRadius = plat.width / 2;
        // Water wake ripple under pad
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.ellipse(platX, rowScreenY + 2, leafRadius + 6, leafRadius * 0.45 + 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Emerald pad
        const padGrad = ctx.createRadialGradient(platX - 8, rowScreenY - 4, 4, platX, rowScreenY, leafRadius);
        padGrad.addColorStop(0, '#10b981');
        padGrad.addColorStop(0.7, '#047857');
        padGrad.addColorStop(1, '#064e3b');
        ctx.fillStyle = padGrad;
        ctx.beginPath();
        ctx.ellipse(platX, rowScreenY, leafRadius, leafRadius * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden rim
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Small pink sacred lotus petal on the leaf
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.ellipse(platX + leafRadius * 0.65, rowScreenY - 4, 7, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (plat.type === 'log') {
        // 2. Buoyant Carved Sandalwood Temple Log
        const logW = plat.width;
        const logH = 28;
        const lx = platX - logW / 2;
        const ly = rowScreenY - logH / 2;

        // Water foam underneath
        ctx.fillStyle = 'rgba(224, 242, 254, 0.3)';
        ctx.fillRect(lx - 4, ly + 2, logW + 8, logH + 4);

        // Sandalwood body
        const woodGrad = ctx.createLinearGradient(0, ly, 0, ly + logH);
        woodGrad.addColorStop(0, '#b45309');
        woodGrad.addColorStop(0.5, '#78350f');
        woodGrad.addColorStop(1, '#451a03');
        ctx.fillStyle = woodGrad;
        ctx.beginPath();
        ctx.roundRect(lx, ly, logW, logH, 8);
        ctx.fill();

        // Saffron ropes tying the log
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lx + 18, ly);
        ctx.lineTo(lx + 18, ly + logH);
        ctx.moveTo(lx + logW - 18, ly);
        ctx.lineTo(lx + logW - 18, ly + logH);
        ctx.stroke();
      } else {
        // 3. Floating Marigold Temple Barge
        const bargeW = plat.width;
        const bargeH = 32;
        const bx = platX - bargeW / 2;
        const by = rowScreenY - bargeH / 2;

        // Barge hull
        const bargeGrad = ctx.createLinearGradient(0, by, 0, by + bargeH);
        bargeGrad.addColorStop(0, '#92400e');
        bargeGrad.addColorStop(0.5, '#78350f');
        bargeGrad.addColorStop(1, '#3f1a07');
        ctx.fillStyle = bargeGrad;
        ctx.beginPath();
        ctx.roundRect(bx, by, bargeW, bargeH, 10);
        ctx.fill();

        // Golden brass trim
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Marigold garlands across the barge
        const beads = Math.floor(bargeW / 14);
        for (let b = 0; b < beads; b++) {
          ctx.fillStyle = b % 2 === 0 ? '#f59e0b' : '#ea580c';
          ctx.beginPath();
          ctx.arc(bx + 7 + b * 14, by + 4, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Sparkling Modak on platform if present & uncollected
      if (plat.hasModak && !plat.modakCollected) {
        GameRenderer.drawModakVector(ctx, platX, rowScreenY - 8, 16);
      }
    }

    ctx.restore();
  }

  /**
   * Render Mushika (Player) with Hop Parabolic Arc, Scampering Paws, Pink Ears & Tilak
   */
  private renderMushika(ctx: CanvasRenderingContext2D, originX: number, originY: number) {
    const screenX = originX + this.playerWorldX;
    const screenY = originY - this.playerWorldY + this.hopArcY;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Invulnerability blinking
    if (this.isInvulnerable && Math.floor(this.runTime * 14) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    const scale = 1.15;
    const isMoving = this.isHopping;
    const hopCycle = isMoving ? (this.hopTimer / this.hopDuration) * Math.PI : 0;
    const legSwing = Math.sin(hopCycle * 2) * 6 * scale;
    const bodyBob = Math.sin(hopCycle) * 3 * scale + (this.mode === 'OFFERING_TO_GANESHA' ? this.mushikaCelebrationHopY : 0);

    // 1. Soft Shadow on ground/platform (stays on surface even when jumping)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    const shadowScale = 1 - Math.abs(this.hopArcY) * 0.02;
    ctx.ellipse(0, -this.hopArcY + 4 * scale, 22 * scale * shadowScale, 11 * scale * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate or orient based on player facing direction
    if (this.playerFacing === 'left') {
      ctx.scale(-1, 1);
    }

    // 2. Swishing Tail (elegant whip)
    const tailWag = Math.sin(this.runTime * 11) * 7 * scale;
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12 * scale, 4 * scale - bodyBob);
    ctx.quadraticCurveTo(-24 * scale, 12 * scale - bodyBob + tailWag, -22 * scale + tailWag * 0.5, 20 * scale);
    ctx.stroke();

    // 3. Scampering Pink Paws
    ctx.fillStyle = '#fbcfe8';
    // Rear paws
    ctx.beginPath();
    ctx.ellipse(-8 * scale, 6 * scale - bodyBob + legSwing, 4 * scale, 5 * scale, 0.2, 0, Math.PI * 2);
    ctx.ellipse(8 * scale, 6 * scale - bodyBob - legSwing, 4 * scale, 5 * scale, -0.2, 0, Math.PI * 2);
    // Front paws
    ctx.ellipse(-6 * scale, -10 * scale - bodyBob - legSwing, 3.5 * scale, 4.5 * scale, 0.1, 0, Math.PI * 2);
    ctx.ellipse(6 * scale, -10 * scale - bodyBob + legSwing, 3.5 * scale, 4.5 * scale, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // 4. Mouse Body (Silver-grey rounded torso)
    const bodyGrad = ctx.createLinearGradient(0, -18 * scale, 0, 8 * scale);
    bodyGrad.addColorStop(0, '#e7e5e4');
    bodyGrad.addColorStop(0.5, '#a8a29e');
    bodyGrad.addColorStop(1, '#78716c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, -2 * scale - bodyBob, 16 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // 5. Festive Saffron Dhoti Sash
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 2 * scale - bodyBob, 14 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();

    // 6. Cute Mouse Head
    ctx.fillStyle = '#d6d3d1';
    ctx.beginPath();
    ctx.ellipse(0, -14 * scale - bodyBob, 12 * scale, 11 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 7. Large Pink Ears
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.ellipse(-10 * scale, -22 * scale - bodyBob, 7 * scale, 8 * scale, -0.3, 0, Math.PI * 2);
    ctx.ellipse(10 * scale, -22 * scale - bodyBob, 7 * scale, 8 * scale, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(-10 * scale, -22 * scale - bodyBob, 4.5 * scale, 5.5 * scale, -0.3, 0, Math.PI * 2);
    ctx.ellipse(10 * scale, -22 * scale - bodyBob, 4.5 * scale, 5.5 * scale, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 8. Whiskers & Little Pink Snout
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 0.8 * scale;
    ctx.beginPath();
    // Left whiskers
    ctx.moveTo(-4 * scale, -15 * scale - bodyBob);
    ctx.lineTo(-15 * scale, -18 * scale - bodyBob);
    ctx.moveTo(-4 * scale, -13 * scale - bodyBob);
    ctx.lineTo(-15 * scale, -12 * scale - bodyBob);
    // Right whiskers
    ctx.moveTo(4 * scale, -15 * scale - bodyBob);
    ctx.lineTo(15 * scale, -18 * scale - bodyBob);
    ctx.moveTo(4 * scale, -13 * scale - bodyBob);
    ctx.lineTo(15 * scale, -12 * scale - bodyBob);
    ctx.stroke();

    // Pink nose
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(0, -18 * scale - bodyBob, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Vermillion Tilak on forehead
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(0, -14 * scale - bodyBob, 1.5 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -12 * scale - bodyBob, 1 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render Lord Vinayakudu's Grand Festival Mandap
   * Prominently visible in the distance across the river throughout normal gameplay,
   * and approached closely during the ending offering sequence!
   */
  private renderGaneshaMandap(ctx: CanvasRenderingContext2D, screenW: number, screenH: number) {
    ctx.save();

    const isEnding = (this.mode === 'OFFERING_TO_GANESHA' || this.mode === 'RUN_OVER');
    
    // Position on screen:
    // Distant horizon: centered near top screen (Y ~ 75px)
    // Ending sequence: smoothly comes closer to screen center (Y ~ screenH * 0.36)
    let mandapX = screenW / 2;
    let mandapY = 78;
    let mScale = 0.42; // Distant scale

    if (isEnding) {
      const approachT = this.ganeshaApproachProgress;
      mandapY = 78 + (screenH * 0.36 - 78) * approachT;
      mScale = 0.42 + (1.25 - 0.42) * approachT;
    }

    // 1. Distant Shore / Horizon Panorama (Always visible across top)
    if (!isEnding) {
      // Golden twilight sky over horizon
      const skyH = 92;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
      skyGrad.addColorStop(0, '#1a0b2e'); // evening sky
      skyGrad.addColorStop(0.5, '#4c1d95');
      skyGrad.addColorStop(0.85, '#b45309');
      skyGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, screenW, skyH);

      // Distant sacred temple silhouettes on the northern bank
      ctx.fillStyle = 'rgba(30, 10, 45, 0.85)';
      ctx.beginPath();
      ctx.moveTo(0, skyH);
      for (let s = 0; s < screenW; s += 80) {
        ctx.lineTo(s + 20, skyH - 35);
        ctx.lineTo(s + 40, skyH - 12);
        ctx.lineTo(s + 80, skyH);
      }
      ctx.fill();

      // Northern Sacred Bank stone ghat step
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, skyH - 8, screenW, 16);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, skyH - 8, screenW, 16);

      // Flanking burning diyas along the distant bank
      GameRenderer.drawDiya(ctx, mandapX - 110, skyH - 2, 11, this.runTime);
      GameRenderer.drawDiya(ctx, mandapX + 110, skyH - 2, 11, this.runTime);
    }

    ctx.translate(mandapX, mandapY);

    // 2. Golden Mandap Arch & Pillars
    const mandapW = 230 * mScale;
    const mandapH = 250 * mScale;

    // Mandap base plinth
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-mandapW / 2 - 12, -20 * mScale, mandapW + 24, 20 * mScale);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5 * mScale;
    ctx.strokeRect(-mandapW / 2 - 12, -20 * mScale, mandapW + 24, 20 * mScale);

    // Two Golden pillars
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-mandapW / 2, -mandapH * 0.75, 20 * mScale, mandapH * 0.75);
    ctx.fillRect(mandapW / 2 - 20 * mScale, -mandapH * 0.75, 20 * mScale, mandapH * 0.75);

    // Pillar accents
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5 * mScale;
    ctx.strokeRect(-mandapW / 2, -mandapH * 0.75, 20 * mScale, mandapH * 0.75);
    ctx.strokeRect(mandapW / 2 - 20 * mScale, -mandapH * 0.75, 20 * mScale, mandapH * 0.75);

    // Mandap Ornate Arch Roof
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(-mandapW / 2 - 22 * mScale, -mandapH * 0.75);
    ctx.lineTo(0, -mandapH);
    ctx.lineTo(mandapW / 2 + 22 * mScale, -mandapH * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3 * mScale;
    ctx.stroke();

    // Kalash peak on Mandap top
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -mandapH - 12 * mScale, 12 * mScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2 * mScale;
    ctx.stroke();

    // 3. Divine Radiant Halo behind Vinayakudu
    const pulseFactor = (this.mode === 'OFFERING_TO_GANESHA' && this.offeringPhase === 'CELEBRATION')
      ? 1 + Math.sin(this.runTime * 4) * 0.15
      : 1 + Math.sin(this.runTime * 2) * 0.05;
    const haloRadius = 90 * mScale * pulseFactor;
    const haloGrad = ctx.createRadialGradient(0, -90 * mScale, 10, 0, -90 * mScale, haloRadius);
    haloGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    haloGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)');
    haloGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, -90 * mScale, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Lord Vinayakudu in Divine Vector Glory
    GameRenderer.drawDetailedVinayaka(ctx, 0, -80 * mScale, this.runTime, 1.5 * mScale);

    // 5. Golden Pooja Thali with Offered Modaks
    if (this.offeredCount > 0) {
      const displayModaks = Math.min(30, this.offeredCount);
      for (let i = 0; i < displayModaks; i++) {
        const ox = ((i % 6) - 2.5) * (7 * mScale);
        const oy = -55 * mScale - Math.floor(i / 6) * (6 * mScale);
        GameRenderer.drawModakVector(ctx, ox, oy, 11 * mScale);
      }
    }

    // 6. Burning Diyas on Plinth
    GameRenderer.drawDiya(ctx, -mandapW / 2 - 10 * mScale, -20 * mScale, 18 * mScale, this.runTime);
    GameRenderer.drawDiya(ctx, mandapW / 2 + 10 * mScale, -20 * mScale, 18 * mScale, this.runTime);

    ctx.restore();
  }

  /**
   * Render Flying Modaks Arcing toward Vinayakudu's Thali
   */
  private renderFlyingModaks(ctx: CanvasRenderingContext2D) {
    for (const fm of this.flyingModaks) {
      if (fm.progress >= 0 && !fm.finished) {
        ctx.save();
        // Golden trail
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.beginPath();
        ctx.arc(fm.currentX, fm.currentY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Modak
        GameRenderer.drawModakVector(ctx, fm.currentX, fm.currentY, 18);
        ctx.restore();
      }
    }
  }

  /**
   * Render Flower Petals for Celebration / Run Over
   */
  private renderScreenPetals(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const sp of this.screenPetals) {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(sp.rot);
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, sp.size, sp.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Render Particles in World space
   */
  private renderWorldParticles(ctx: CanvasRenderingContext2D, originX: number, originY: number) {
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(originX + p.x, originY - p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Top HUD Bar (5 Hearts, Modaks, Score, Rows, Time)
   */
  private renderHUD(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    // Top translucent bar
    const hudW = Math.min(width - 24, 720);
    const hudX = (width - hudW) / 2;
    const hudY = 12;
    const hudH = 52;

    ctx.fillStyle = 'rgba(62, 48, 40, 0.90)';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 12);
    ctx.fill();
    ctx.stroke();

    // 1. 5 HEARTS DISPLAY
    let heartsStr = '';
    for (let h = 0; h < this.maxHearts; h++) {
      heartsStr += (h < this.hearts) ? '❤️' : '🤍';
    }
    ctx.font = '16px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(heartsStr, hudX + 16, hudY + 32);

    // 2. MODAKS COLLECTED
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px Cinzel, serif';
    ctx.fillStyle = '#E8C766';
    ctx.fillText(`🥟 ${this.modaksCollected}`, hudX + hudW * 0.42, hudY + 32);

    // 3. SCORE
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillStyle = '#F6EBD8';
    ctx.fillText(`SCORE: ${this.score}`, hudX + hudW * 0.65, hudY + 32);

    // 4. ROWS CROSSED
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillStyle = '#C98232';
    ctx.fillText(`🌊 ROW ${this.highestRow}`, hudX + hudW - 16, hudY + 32);

    ctx.restore();
  }

  /**
   * On-Screen Arcade Touch Directional Controls for Mobile / Tablets
   */
  private renderArcadeTouchControls(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    const dpadCenterY = height - 85;
    const dpadCenterX = width / 2;
    const btnRadius = 28;

    const renderBtn = (bx: number, by: number, label: string, isPressed: boolean) => {
      ctx.save();
      ctx.fillStyle = isPressed ? 'rgba(201, 130, 50, 0.9)' : 'rgba(62, 48, 40, 0.85)';
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by, btnRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isPressed ? '#3E3028' : '#F6EBD8';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, bx, by);
      ctx.restore();
    };

    // UP Button
    renderBtn(dpadCenterX, dpadCenterY - 42, '▲', this.touchBtnPressed === 'up');
    // LEFT Button
    renderBtn(dpadCenterX - 75, dpadCenterY, '◀', this.touchBtnPressed === 'left');
    // RIGHT Button
    renderBtn(dpadCenterX + 75, dpadCenterY, '▶', this.touchBtnPressed === 'right');
    // DOWN Button
    renderBtn(dpadCenterX, dpadCenterY + 42, '▼', this.touchBtnPressed === 'down');

    ctx.restore();
  }

  /**
   * Countdown Overlay (3, 2, 1, HOP!)
   */
  private renderCountdownOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    const count = Math.ceil(this.countdownTimer);
    const text = count > 0 ? `${count}` : 'HOP!';

    ctx.fillStyle = 'rgba(62, 48, 40, 0.75)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 64px Cinzel, serif';
    ctx.fillStyle = '#E8C766';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#C6A15B';
    ctx.shadowBlur = 24;
    ctx.fillText(text, width / 2, height * 0.48);

    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillStyle = '#F6EBD8';
    ctx.shadowBlur = 0;
    ctx.fillText('Cross the sacred river & collect Modaks for Ganesha!', width / 2, height * 0.56);

    ctx.restore();
  }

  /**
   * Instructions Overlay Screen before starting
   */
  private renderInstructionsOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    // Dark festive backdrop
    ctx.fillStyle = 'rgba(30, 22, 18, 0.94)';
    ctx.fillRect(0, 0, width, height);

    const isLandscape = width >= height;
    const cardW = isLandscape ? Math.min(width - 32, 640) : Math.min(width - 32, 480);
    const cardH = isLandscape ? Math.min(height - 24, 380) : Math.min(height - 32, 540);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;

    // Card frame
    ctx.fillStyle = '#3E3028';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 18);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.textAlign = 'center';
    ctx.font = isLandscape ? 'bold 20px Cinzel, serif' : 'bold 22px Cinzel, serif';
    ctx.fillStyle = '#E8C766';
    ctx.fillText("🌊 GANESHA'S RIVER CROSSING", width / 2, cardY + (isLandscape ? 32 : 40));

    // Subtitle
    ctx.font = isLandscape ? '12px Outfit, sans-serif' : '13px Outfit, sans-serif';
    ctx.fillStyle = '#F6EBD8';
    ctx.fillText('Endless Survival + Modak Collection Arcade Game', width / 2, cardY + (isLandscape ? 52 : 64));

    // Decorative divider
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 30, cardY + (isLandscape ? 64 : 78));
    ctx.lineTo(cardX + cardW - 30, cardY + (isLandscape ? 64 : 78));
    ctx.stroke();

    // Game Instructions List
    const lines = [
      '🐭 Guide brave Mushika across the flowing river.',
      '🪵 Hop onto moving lotus pads & rafts.',
      '🥟 Collect unlimited golden Modaks.',
      '❤️ 5 Hearts — falling into water loses 1 Heart.',
      '🌊 Platforms move faster as you survive longer!',
      '🛕 Ganesha is serenely waiting across the river.',
      '✨ Mushika will offer all Modaks to Ganesha!'
    ];

    if (isLandscape) {
      // 2-Column layout in landscape
      const startY = cardY + 92;
      const col1X = cardX + 24;
      const col2X = cardX + cardW / 2 + 10;
      ctx.textAlign = 'left';
      ctx.font = '12px Outfit, sans-serif';

      lines.slice(0, 4).forEach((line, idx) => {
        ctx.fillStyle = idx === 3 ? '#fca5a5' : '#F6EBD8';
        ctx.fillText(line, col1X, startY + idx * 24);
      });
      lines.slice(4).forEach((line, idx) => {
        ctx.fillStyle = '#F6EBD8';
        ctx.fillText(line, col2X, startY + idx * 24);
      });

      // Landscape Buttons side-by-side
      const btnW = 220;
      const retW = 180;
      const gap = 16;
      const totalBtnW = btnW + retW + gap;
      const btnX = width / 2 - totalBtnW / 2;
      const retX = btnX + btnW + gap;
      const btnY = cardY + cardH - 58;
      const btnH = 44;

      this.instructionsStartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
      this.instructionsReturnBtn = { x: retX, y: btnY, w: retW, h: btnH };

      // START BUTTON
      const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
      btnGrad.addColorStop(0, '#C98232');
      btnGrad.addColorStop(1, '#E8C766');
      ctx.fillStyle = btnGrad;
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 10);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#3E3028';
      ctx.font = 'bold 14px Cinzel, serif';
      ctx.fillText('▶  START RIVER CROSSING', btnX + btnW / 2, btnY + 27);

      // RETURN BUTTON
      ctx.fillStyle = '#7A2E2E';
      ctx.beginPath();
      ctx.roundRect(retX, btnY, retW, btnH, 10);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.fillText('← RETURN TO WORLD', retX + retW / 2, btnY + 27);
    } else {
      // Portrait layout
      const startY = cardY + 106;
      ctx.textAlign = 'left';
      ctx.font = '13px Outfit, sans-serif';
      const leftMargin = cardX + 24;

      lines.forEach((line, idx) => {
        ctx.fillStyle = idx === 3 ? '#fca5a5' : '#F6EBD8';
        ctx.fillText(line, leftMargin, startY + idx * 28);
      });

      // Buttons stacked in portrait
      const btnW = Math.min(cardW - 48, 360);
      const btnH = 46;
      const btnX = (width - btnW) / 2;
      const btnY = cardY + cardH - 106;

      this.instructionsStartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

      const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
      btnGrad.addColorStop(0, '#C98232');
      btnGrad.addColorStop(1, '#E8C766');
      ctx.fillStyle = btnGrad;
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 12);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#3E3028';
      ctx.font = 'bold 15px Cinzel, serif';
      ctx.fillText('▶  START RIVER CROSSING', width / 2, btnY + 29);

      // RETURN BUTTON
      const retY = btnY + 54;
      const retH = 38;
      this.instructionsReturnBtn = { x: btnX, y: retY, w: btnW, h: retH };

      ctx.fillStyle = '#7A2E2E';
      ctx.beginPath();
      ctx.roundRect(btnX, retY, btnW, retH, 10);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.stroke();

      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText('← RETURN TO WORLD', width / 2, retY + 24);
    }

    ctx.restore();
  }

  /**
   * Run Over / Game Complete Screen
   */
  private renderRunOverOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    // Dark celebration backdrop
    ctx.fillStyle = 'rgba(30, 22, 18, 0.94)';
    ctx.fillRect(0, 0, width, height);

    const isLandscape = width >= height;
    const cardW = isLandscape ? Math.min(width - 32, 580) : Math.min(width - 32, 460);
    const cardH = isLandscape ? Math.min(height - 24, 360) : Math.min(height - 32, 480);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;

    ctx.fillStyle = '#3E3028';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 18);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.textAlign = 'center';
    ctx.font = isLandscape ? 'bold 20px Cinzel, serif' : 'bold 22px Cinzel, serif';
    ctx.fillStyle = '#E8C766';
    ctx.fillText('🌸 RIVER CROSSING COMPLETE 🌸', width / 2, cardY + (isLandscape ? 34 : 44));

    ctx.font = isLandscape ? '12px Outfit, sans-serif' : '13px Outfit, sans-serif';
    ctx.fillStyle = '#F6EBD8';
    ctx.fillText('Lord Vinayakudu joyfully accepted all your sacred offerings!', width / 2, cardY + (isLandscape ? 54 : 68));

    // Stats Grid
    const stats = [
      { label: 'MODAKS OFFERED', val: `🥟 ${this.modaksCollected}`, color: '#E8C766' },
      { label: 'FINAL SCORE', val: `${this.score}`, color: '#F6EBD8' },
      { label: 'TIME SURVIVED', val: `${Math.floor(this.timeSurvived)}s`, color: '#C98232' },
      { label: 'RIVER ROWS CROSSED', val: `🌊 ${this.highestRow}`, color: '#E8C766' },
    ];

    if (isLandscape) {
      // 2x2 grid for landscape
      const gridStartY = cardY + 76;
      const colW = (cardW - 56) / 2;
      const colH = 46;
      const colGap = 12;

      stats.forEach((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = cardX + 22 + col * (colW + colGap);
        const by = gridStartY + row * (colH + 10);

        ctx.fillStyle = 'rgba(36, 74, 58, 0.45)';
        ctx.strokeStyle = '#C6A15B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, colW, colH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.fillStyle = '#F6EBD8';
        ctx.fillText(st.label, bx + 12, by + 18);

        ctx.textAlign = 'right';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillStyle = st.color;
        ctx.fillText(st.val, bx + colW - 12, by + 34);
      });

      // Action Buttons side-by-side
      const btnW = 190;
      const btnH = 44;
      const btnY = cardY + cardH - 58;
      const leftBtnX = width / 2 - btnW - 12;
      const rightBtnX = width / 2 + 12;

      this.runOverPlayAgainBtn = { x: leftBtnX, y: btnY, w: btnW, h: btnH };
      this.runOverReturnBtn = { x: rightBtnX, y: btnY, w: btnW, h: btnH };

      // PLAY AGAIN BUTTON
      const playGrad = ctx.createLinearGradient(leftBtnX, btnY, leftBtnX + btnW, btnY);
      playGrad.addColorStop(0, '#C98232');
      playGrad.addColorStop(1, '#E8C766');
      ctx.fillStyle = playGrad;
      ctx.beginPath();
      ctx.roundRect(leftBtnX, btnY, btnW, btnH, 10);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 14px Cinzel, serif';
      ctx.fillStyle = '#3E3028';
      ctx.fillText('PLAY AGAIN ↺', leftBtnX + btnW / 2, btnY + 27);

      // RETURN TO WORLD BUTTON
      ctx.fillStyle = '#7A2E2E';
      ctx.beginPath();
      ctx.roundRect(rightBtnX, btnY, btnW, btnH, 10);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.fillText('← RETURN TO WORLD', rightBtnX + btnW / 2, btnY + 27);
    } else {
      // 4 rows in portrait
      const statStartY = cardY + 98;
      stats.forEach((st, idx) => {
        const rowY = statStartY + idx * 44;
        ctx.fillStyle = 'rgba(36, 74, 58, 0.45)';
        ctx.strokeStyle = '#C6A15B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardX + 24, rowY - 12, cardW - 48, 38, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = 'bold 12px Cinzel, serif';
        ctx.fillStyle = '#F6EBD8';
        ctx.fillText(st.label, cardX + 38, rowY + 12);

        ctx.textAlign = 'right';
        ctx.font = 'bold 17px Outfit, sans-serif';
        ctx.fillStyle = st.color;
        ctx.fillText(st.val, cardX + cardW - 38, rowY + 13);
      });

      // Action Buttons stacked or 2 columns in portrait
      const btnW = Math.min((cardW - 60) / 2, 170);
      const btnH = 46;
      const btnY = cardY + cardH - 68;
      const leftBtnX = width / 2 - btnW - 8;
      const rightBtnX = width / 2 + 8;

      this.runOverPlayAgainBtn = { x: leftBtnX, y: btnY, w: btnW, h: btnH };
      this.runOverReturnBtn = { x: rightBtnX, y: btnY, w: btnW, h: btnH };

      // PLAY AGAIN BUTTON
      const playGrad = ctx.createLinearGradient(leftBtnX, btnY, leftBtnX + btnW, btnY);
      playGrad.addColorStop(0, '#C98232');
      playGrad.addColorStop(1, '#E8C766');
      ctx.fillStyle = playGrad;
      ctx.beginPath();
      ctx.roundRect(leftBtnX, btnY, btnW, btnH, 10);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 14px Cinzel, serif';
      ctx.fillStyle = '#3E3028';
      ctx.fillText('PLAY AGAIN', leftBtnX + btnW / 2, btnY + 28);

      // RETURN TO WORLD BUTTON
      ctx.fillStyle = '#7A2E2E';
      ctx.beginPath();
      ctx.roundRect(rightBtnX, btnY, btnW, btnH, 10);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText('RETURN TO WORLD', rightBtnX + btnW / 2, btnY + 28);
    }

    ctx.restore();
  }
}
