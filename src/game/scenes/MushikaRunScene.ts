/**
 * Chapter: Mushika Run
 * Complete, polished arcade runner mini-game for Ganesh Chaturthi.
 * Player controls Mushika to collect Modaks, avoid obstacles,
 * and deliver all sacred offerings to Lord Ganesha!
 */

import { soundEngine } from '../../audio/soundEngine';
import { FeastGameResult, Particle } from '../../types';
import { GameStorage } from '../../utils/storage';
import { GameRenderer } from '../renderer';

function formatSurvivalTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) {
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  return `${s}s`;
}

export type MushikaRunMode = 
  | 'INSTRUCTIONS'
  | 'COUNTDOWN'
  | 'RUNNING'
  | 'OFFERING_TO_GANESHA'
  | 'RUN_OVER';

interface ModakItem {
  id: number;
  laneX: number; // -120 to +120
  z: number;     // world position along infinite track
  collected: boolean;
  bobOffset: number;
}

interface ObstacleItem {
  id: number;
  type: 'stone' | 'wood_block' | 'brass_pot' | 'barrier';
  laneX: number;
  z: number;
  width: number;
  height: number;
}

export class MushikaRunScene {
  // Game state
  public mode: MushikaRunMode = 'INSTRUCTIONS';
  public score: number = 0;
  public modaksCollected: number = 0;
  public lives: number = 5;
  public readonly maxLives: number = 5;
  public timeElapsed: number = 0;

  // Track & Mushika position (Endless runner)
  public playerX: number = 0; // -140 to +140
  public playerTargetX: number = 0;
  public playerZ: number = 0; // world distance run
  public baseSpeed: number = 160; // px per second (starts slow & comfortable)
  public currentSpeed: number = 160;
  public isInvulnerable: boolean = false;
  public invulnerableTimer: number = 0;

  // Ending Vinayakudu Offering Sequence
  public endingGaneshaZ: number = 0;
  public offeringPhase: 'APPROACH' | 'OFFERING' | 'CELEBRATION' = 'APPROACH';
  public offeringTimer: number = 0;
  public offeredCount: number = 0;
  public mushikaHopY: number = 0;
  private flyingModaks: Array<{
    id: number;
    delay: number;
    progress: number;
    targetX: number;
    targetY: number;
    landed: boolean;
    scale: number;
  }> = [];
  private flowerPetals: Array<{
    x: number;
    y: number;
    vy: number;
    vx: number;
    rot: number;
    rotSpeed: number;
    size: number;
    color: string;
  }> = [];

  // Endless procedural generation
  private nextSpawnZ: number = 240;
  private nextObstacleId: number = 1;
  private nextModakId: number = 1;
  private lastObstacleZ: number = 0;

  // Controls
  public steeringInput: number = 0; // -1 (left) to +1 (right)
  public touchSteerLeft: boolean = false;
  public touchSteerRight: boolean = false;

  // Countdown
  public countdownVal: number = 3;
  public countdownTimer: number = 0;
  public countdownText: string = '3';

  // Story modal state
  public showWhyModal: boolean = false;

  // Visual effects
  private particles: Particle[] = [];
  private screenShake: number = 0;
  private redFlashAlpha: number = 0;
  private celebrationAlpha: number = 0;
  private runTime: number = 0;

  // Track Items
  private modaks: ModakItem[] = [];
  private obstacles: ObstacleItem[] = [];

  // Callbacks
  private onGameOverCallback: (result: FeastGameResult) => void;
  private onReturnToWorldCallback: () => void;
  private hasTriggeredGameOver: boolean = false;

  // Responsive Button Bounding Rects for Precision Hit-Testing
  private instructionsStartBtn = { x: 0, y: 0, w: 0, h: 0 };
  private instructionsReturnBtn = { x: 0, y: 0, w: 0, h: 0 };
  private instructionsWhyBtn = { x: 0, y: 0, w: 0, h: 0 };
  private whyModalCloseBtn = { x: 0, y: 0, w: 0, h: 0 };
  private runOverPlayAgainBtn = { x: 0, y: 0, w: 0, h: 0 };
  private runOverReturnBtn = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    onGameOver: (result: FeastGameResult) => void,
    onReturnToWorld: () => void
  ) {
    this.onGameOverCallback = onGameOver;
    this.onReturnToWorldCallback = onReturnToWorld;
    this.initTrack();
  }

  /**
   * Layout the initial runway and initialize procedural generation
   */
  private initTrack() {
    this.modaks = [];
    this.obstacles = [];
    this.nextSpawnZ = 240;
    this.nextObstacleId = 1;
    this.nextModakId = 1;
    this.lastObstacleZ = 0;

    // Pre-populate runway up to 1600 units ahead
    this.generateAhead(1600);
  }

  /**
   * Continuously generate items ahead of Mushika for endless survival
   */
  private generateAhead(targetZ: number) {
    const lanes = [-80, 0, 80];

    while (this.nextSpawnZ < targetZ) {
      const currentZ = this.nextSpawnZ;
      const distFromLastObstacle = currentZ - this.lastObstacleZ;

      // Obstacle row logic: minimum gap of 220 units between obstacle rows for fair dodging
      const minGap = 220;
      let spawnedObstacleLanes: number[] = [];

      if (distFromLastObstacle >= minGap && Math.random() < 0.65) {
        this.lastObstacleZ = currentZ;

        // Number of blocked lanes: 1 lane early on, occasionally 2 lanes after 25s survival
        const allowDoubleObstacle = this.timeElapsed > 25 && Math.random() < 0.22;
        const numObstacles = allowDoubleObstacle ? 2 : 1;

        // Shuffle lanes and pick obstacle lanes (ALWAYS leaving at least 1 wide open safe lane!)
        const shuffledLanes = [...lanes].sort(() => Math.random() - 0.5);
        spawnedObstacleLanes = shuffledLanes.slice(0, numObstacles);

        const types: Array<'stone' | 'wood_block' | 'brass_pot' | 'barrier'> = [
          'stone', 'wood_block', 'brass_pot', 'barrier'
        ];

        for (const laneX of spawnedObstacleLanes) {
          const type = types[Math.floor(Math.random() * types.length)];
          let width = 34;
          let height = 26;
          if (type === 'wood_block') { width = 36; height = 28; }
          else if (type === 'brass_pot') { width = 32; height = 32; }
          else if (type === 'barrier') { width = 44; height = 24; }

          this.obstacles.push({
            id: this.nextObstacleId++,
            type,
            laneX,
            z: currentZ,
            width,
            height
          });
        }
      }

      // Plentiful Modak spawns in safe lanes for continuous unlimited collecting
      const safeLanes = lanes.filter(l => !spawnedObstacleLanes.includes(l));
      if (safeLanes.length > 0) {
        if (spawnedObstacleLanes.length > 0) {
          // Reward dodging by placing a modak in a clear lane
          const modakLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
          this.modaks.push({
            id: this.nextModakId++,
            laneX: modakLane,
            z: currentZ,
            collected: false,
            bobOffset: Math.random() * Math.PI * 2
          });
        } else {
          // Open stretch: spawn 1 or 2 modaks
          const count = Math.random() < 0.45 ? Math.min(2, safeLanes.length) : 1;
          const chosenLanes = [...safeLanes].sort(() => Math.random() - 0.5).slice(0, count);
          for (const laneX of chosenLanes) {
            this.modaks.push({
              id: this.nextModakId++,
              laneX,
              z: currentZ,
              collected: false,
              bobOffset: Math.random() * Math.PI * 2
            });
          }
        }
      }

      // Step forward to next spawn point
      this.nextSpawnZ += 140 + Math.random() * 35;
    }
  }

  /**
   * Reset game state for fresh run
   */
  public reset() {
    this.mode = 'INSTRUCTIONS';
    this.hasTriggeredGameOver = false;
    this.score = 0;
    this.modaksCollected = 0;
    this.lives = this.maxLives;
    this.timeElapsed = 0;
    this.playerX = 0;
    this.playerTargetX = 0;
    this.playerZ = 0;
    this.baseSpeed = 160;
    this.currentSpeed = 160;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.steeringInput = 0;
    this.touchSteerLeft = false;
    this.touchSteerRight = false;
    this.showWhyModal = false;
    this.particles = [];
    this.screenShake = 0;
    this.redFlashAlpha = 0;
    this.celebrationAlpha = 0;
    this.endingGaneshaZ = 0;
    this.offeringPhase = 'APPROACH';
    this.offeringTimer = 0;
    this.offeredCount = 0;
    this.mushikaHopY = 0;
    this.flyingModaks = [];
    this.flowerPetals = [];
    this.initTrack();
  }

  /**
   * Start Ending Sequence when 5th heart is lost:
   * Smoothly brings Lord Vinayakudu closer from the distance and offers all collected Modaks!
   */
  public startEndingSequence() {
    this.mode = 'OFFERING_TO_GANESHA';
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.steeringInput = 0;
    this.touchSteerLeft = false;
    this.touchSteerRight = false;

    // Start Vinayakudu at the distant position where He was seen ahead on the path
    this.endingGaneshaZ = this.playerZ + 460;

    // Clear remaining track obstacles & uncollected items so courtyard is clear
    this.obstacles = [];
    this.modaks = [];

    // Save score in local storage
    GameStorage.recordChapterScore('mushaks_adventure', this.score);

    this.offeringPhase = 'APPROACH';
    this.offeringTimer = 0;
    this.offeredCount = 0;
    this.mushikaHopY = 0;
    this.flyingModaks = [];
    this.flowerPetals = [];

    soundEngine.playTempleBell(1.1);
  }

  /**
   * Initialize flying Modaks for offering animation to Lord Vinayakudu
   */
  private initFlyingModaks() {
    this.flyingModaks = [];
    const total = this.modaksCollected;
    if (total <= 0) return;

    // Dynamic delay step to make offering sequence fluid and satisfying
    const delayStep = Math.max(0.04, Math.min(0.22, 2.2 / Math.max(1, total)));

    for (let i = 0; i < total; i++) {
      this.flyingModaks.push({
        id: i,
        delay: i * delayStep,
        progress: 0,
        targetX: (Math.random() - 0.5) * 32,
        targetY: (Math.random() - 0.5) * 16,
        landed: false,
        scale: 0.9 + Math.random() * 0.2,
      });
    }
  }

  /**
   * Spawn shower of festive flower petals during celebration
   */
  private spawnCelebrationPetals(width: number) {
    const colors = ['#f97316', '#facc15', '#f43f5e', '#fef08a', '#fbbf24'];
    for (let i = 0; i < 40; i++) {
      this.flowerPetals.push({
        x: Math.random() * width,
        y: -20 - Math.random() * 200,
        vy: 50 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 40,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  /**
   * Spawn continuous single petal drift during celebration
   */
  private spawnSinglePetal(width: number) {
    const colors = ['#f97316', '#facc15', '#f43f5e', '#fef08a', '#fbbf24'];
    this.flowerPetals.push({
      x: Math.random() * width,
      y: -15,
      vy: 45 + Math.random() * 70,
      vx: (Math.random() - 0.5) * 35,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 3,
      size: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  /**
   * Start 3-2-1-GO Countdown
   */
  public startCountdown() {
    this.mode = 'COUNTDOWN';
    this.countdownVal = 3;
    this.countdownText = '3';
    this.countdownTimer = 0;
    soundEngine.playCountdownBeep(3);
  }

  /**
   * Start Active Run
   */
  public startRunning() {
    this.mode = 'RUNNING';
    this.currentSpeed = this.baseSpeed;
  }

  /**
   * Main game update loop
   */
  public update(dt: number, width: number, height: number) {
    this.runTime += dt;

    // Diminish screen shake and red flash
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }
    if (this.redFlashAlpha > 0) {
      this.redFlashAlpha = Math.max(0, this.redFlashAlpha - dt * 3);
    }

    // Update floating particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Invulnerability blinking timer
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // State Machine Updates
    switch (this.mode) {
      case 'INSTRUCTIONS':
        break;

      case 'COUNTDOWN': {
        this.countdownTimer += dt;
        if (this.countdownTimer >= 0.8) {
          this.countdownTimer = 0;
          this.countdownVal--;
          if (this.countdownVal === 2) {
            this.countdownText = '2';
            soundEngine.playCountdownBeep(2);
          } else if (this.countdownVal === 1) {
            this.countdownText = '1';
            soundEngine.playCountdownBeep(1);
          } else if (this.countdownVal === 0) {
            this.countdownText = 'GO!';
            soundEngine.playCountdownBeep('GO');
          } else {
            this.startRunning();
          }
        }
        break;
      }

      case 'RUNNING': {
        this.timeElapsed += dt;

        // Progressive speed increase:
        // START (slow ~160px/s) -> gradually faster -> challenging (320-360px/s) -> very challenging (390-420px/s)
        const timeBonus = Math.min(230, this.timeElapsed * 2.3);
        const modakBonus = Math.min(30, this.modaksCollected * 0.75);
        this.currentSpeed = this.baseSpeed + timeBonus + modakBonus;

        // Steering input resolution
        let steerDir = this.steeringInput;
        if (this.touchSteerLeft) steerDir -= 1;
        if (this.touchSteerRight) steerDir += 1;
        steerDir = Math.max(-1, Math.min(1, steerDir));

        // Smooth responsive lateral steering (scales gently with forward speed for fair reaction time)
        const lateralSpeed = Math.max(260, 240 + (this.currentSpeed - 160) * 0.35);
        this.playerX += steerDir * lateralSpeed * dt;
        // Strict boundary clamping on paved path
        const maxLane = 125;
        this.playerX = Math.max(-maxLane, Math.min(maxLane, this.playerX));

        // Advance forward endlessly
        this.playerZ += this.currentSpeed * dt;

        // Continuously generate track ahead & clean up passed entities
        this.generateAhead(this.playerZ + 1500);
        this.modaks = this.modaks.filter(m => m.z >= this.playerZ - 250);
        this.obstacles = this.obstacles.filter(o => o.z >= this.playerZ - 250);

        // Running dust puffs trailing behind Mushika
        if (Math.random() < 0.35) {
          this.particles.push({
            x: this.playerX + (Math.random() - 0.5) * 16,
            y: 0, // calculated relative to player in render
            vx: (Math.random() - 0.5) * 30,
            vy: 20 + Math.random() * 20,
            life: 0.35,
            maxLife: 0.35,
            size: 3 + Math.random() * 3,
            color: 'rgba(254, 215, 170, 0.6)',
            alpha: 0.7
          });
        }

        // Check Modak collisions (continuous unlimited collecting)
        for (const modak of this.modaks) {
          if (!modak.collected) {
            const dz = Math.abs(this.playerZ - modak.z);
            const dx = Math.abs(this.playerX - modak.laneX);
            if (dz < 35 && dx < 42) {
              modak.collected = true;
              this.modaksCollected++;
              this.score += 100;
              soundEngine.playCollectFood(this.modaksCollected);

              // Burst sparkles
              for (let k = 0; k < 12; k++) {
                const angle = (k / 12) * Math.PI * 2;
                const spd = 60 + Math.random() * 60;
                this.particles.push({
                  x: modak.laneX,
                  y: -20,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  life: 0.45,
                  maxLife: 0.45,
                  size: 3 + Math.random() * 2.5,
                  color: k % 2 === 0 ? '#fef08a' : '#f59e0b',
                  alpha: 1
                });
              }

              // Floating "+100" text
              this.particles.push({
                x: modak.laneX,
                y: -30,
                vx: 0,
                vy: -60,
                life: 0.8,
                maxLife: 0.8,
                size: 16,
                color: '#fef08a',
                alpha: 1,
                text: '+100'
              });
            }
          }
        }

        // Check Obstacle collisions (each collision removes 1 heart)
        if (!this.isInvulnerable) {
          for (const obs of this.obstacles) {
            const dz = Math.abs(this.playerZ - obs.z);
            const dx = Math.abs(this.playerX - obs.laneX);
            if (dz < (obs.height * 0.7 + 15) && dx < (obs.width * 0.6 + 18)) {
              // Impact! Remove 1 heart
              this.isInvulnerable = true;
              this.invulnerableTimer = 1.5;
              this.lives--;
              this.screenShake = 6;
              this.redFlashAlpha = 0.45;
              soundEngine.playObstacleHit();

              // Red/spark debris
              for (let k = 0; k < 10; k++) {
                const angle = (k / 10) * Math.PI * 2;
                const spd = 40 + Math.random() * 50;
                this.particles.push({
                  x: obs.laneX,
                  y: -15,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  life: 0.35,
                  maxLife: 0.35,
                  size: 3.5,
                  color: '#ef4444',
                  alpha: 1
                });
              }

              // When all 5 hearts are lost, trigger ending sequence to Lord Vinayakudu!
              if (this.lives <= 0) {
                this.startEndingSequence();
              }
              break;
            }
          }
        }
        break;
      }

      case 'OFFERING_TO_GANESHA': {
        this.offeringTimer += dt;

        // Update celebration flower petals
        for (let i = this.flowerPetals.length - 1; i >= 0; i--) {
          const petal = this.flowerPetals[i];
          petal.y += petal.vy * dt;
          petal.x += petal.vx * dt;
          petal.rot += petal.rotSpeed * dt;
          if (petal.y > height + 25) {
            this.flowerPetals.splice(i, 1);
          }
        }

        if (this.offeringPhase === 'APPROACH') {
          // Smoothly bring Ganesha closer from the distant horizon to Mushika
          const targetGaneshaRelZ = 135;
          const currentRelZ = this.endingGaneshaZ - this.playerZ;
          const newRelZ = currentRelZ + (targetGaneshaRelZ - currentRelZ) * Math.min(1, dt * 2.8);
          this.endingGaneshaZ = this.playerZ + newRelZ;

          // Mushika gently centers in front of the Mandap
          this.playerX += (0 - this.playerX) * Math.min(1, dt * 5);

          if (this.offeringTimer >= 1.3 || Math.abs(newRelZ - targetGaneshaRelZ) < 5) {
            this.playerX = 0;
            this.endingGaneshaZ = this.playerZ + targetGaneshaRelZ;
            this.offeringPhase = 'OFFERING';
            this.offeringTimer = 0;
            soundEngine.playTempleBell(1.2);
            this.initFlyingModaks();
          }
        } else if (this.offeringPhase === 'OFFERING') {
          // If no Modaks were collected, short devotion bow before celebration
          if (this.modaksCollected <= 0) {
            if (this.offeringTimer >= 1.0) {
              this.offeringPhase = 'CELEBRATION';
              this.offeringTimer = 0;
              soundEngine.playComboStreak(3);
              soundEngine.playTempleBell(1.4);
              this.spawnCelebrationPetals(width);
            }
          } else {
            // Arc each collected Modak to Lord Vinayakudu's Pooja Thali
            let allLanded = true;
            for (const fm of this.flyingModaks) {
              if (!fm.landed) {
                if (this.offeringTimer >= fm.delay) {
                  fm.progress += dt / 0.52;
                  if (fm.progress >= 1) {
                    fm.progress = 1;
                    fm.landed = true;
                    this.offeredCount++;
                    soundEngine.playCollectFood(this.offeredCount);

                    // Golden sparkles burst on Vinayakudu's Pooja Thali
                    for (let k = 0; k < 5; k++) {
                      const angle = Math.random() * Math.PI * 2;
                      const spd = 35 + Math.random() * 45;
                      this.particles.push({
                        x: fm.targetX,
                        y: -50 + fm.targetY,
                        vx: Math.cos(angle) * spd,
                        vy: Math.sin(angle) * spd,
                        life: 0.35,
                        maxLife: 0.35,
                        size: 3.5 + Math.random() * 2,
                        color: k % 2 === 0 ? '#fef08a' : '#f59e0b',
                        alpha: 1
                      });
                    }
                  } else {
                    allLanded = false;
                  }
                } else {
                  allLanded = false;
                }
              }
            }

            const lastDelay = this.flyingModaks[this.flyingModaks.length - 1]?.delay ?? 0;
            if (allLanded && this.offeringTimer >= lastDelay + 0.6) {
              this.offeringPhase = 'CELEBRATION';
              this.offeringTimer = 0;
              soundEngine.playComboStreak(3);
              soundEngine.playTempleBell(1.5);
              this.spawnCelebrationPetals(width);
            }
          }
        } else if (this.offeringPhase === 'CELEBRATION') {
          // Mushika joyful pranam hop
          this.mushikaHopY = Math.abs(Math.sin(this.offeringTimer * 9)) * 16;

          // Continuous gentle petal drift
          if (Math.random() < 0.25) {
            this.spawnSinglePetal(width);
          }

          // Transition to final GAME OVER / RUN COMPLETE screen
          if (this.offeringTimer >= 2.4 && !this.hasTriggeredGameOver) {
            console.log(`[1 GAME OVER] game=mushaks_adventure score=${this.score}`);
            this.hasTriggeredGameOver = true;
            this.mode = 'RUN_OVER';
            soundEngine.playGameOver();

            const { isNewBest, previousBest } = GameStorage.recordChapterScore('mushaks_adventure', this.score);
            const result: FeastGameResult = {
              chapterId: 'mushaks_adventure',
              score: this.score,
              foodCollected: this.modaksCollected,
              bestCombo: Math.floor(this.playerZ / 10),
              timeSurvivedSeconds: Math.floor(this.timeElapsed),
              isNewBest,
              previousBest,
            };
            console.log(`[2 CALLBACK] game=mushaks_adventure result=`, result);
            this.onGameOverCallback(result);
          }
        }
        break;
      }

      case 'RUN_OVER':
        // Keep celebration flower petals drifting gently behind the modal
        for (let i = this.flowerPetals.length - 1; i >= 0; i--) {
          const petal = this.flowerPetals[i];
          petal.y += petal.vy * dt * 0.7;
          petal.x += petal.vx * dt * 0.7;
          petal.rot += petal.rotSpeed * dt;
          if (petal.y > height + 25) {
            this.flowerPetals.splice(i, 1);
          }
        }
        if (Math.random() < 0.15) {
          this.spawnSinglePetal(width);
        }
        break;
    }
  }

  /**
   * Main Render method
   */
  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    // Apply screen shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Festive Background Sky & Temple Courtyard Environment
    this.renderEnvironment(ctx, width, height);

    // 2. Camera & 2.5D Track Projection
    this.renderTrackAndEntities(ctx, width, height);

    // 3. Render Particles
    GameRenderer.drawParticles(ctx, this.particles);

    // 4. Red Hit Flash
    if (this.redFlashAlpha > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${this.redFlashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 5. In-Game HUD (during countdown and running)
    if (this.mode === 'RUNNING' || this.mode === 'COUNTDOWN') {
      this.renderHUD(ctx, width, height);
    }

    // 6. Overlays for specific modes
    if (this.mode === 'INSTRUCTIONS') {
      this.renderInstructionsScreen(ctx, width, height);
    } else if (this.mode === 'COUNTDOWN') {
      this.renderCountdownOverlay(ctx, width, height);
    } else if (this.mode === 'OFFERING_TO_GANESHA') {
      this.renderEndingOfferingHUD(ctx, width, height);
    } else if (this.mode === 'RUN_OVER') {
      this.renderRunOverScreen(ctx, width, height);
    }

    ctx.restore();
  }

  /**
   * Render Festive Environment: Sunset sky, temple silhouettes, marigold garlands, diyas
   */
  private renderEnvironment(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Warm divine festival evening sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    skyGrad.addColorStop(0, '#1c0803');
    skyGrad.addColorStop(0.5, '#3b1206');
    skyGrad.addColorStop(1, '#6b200a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Distant Temple Silhouettes along horizon
    const horizonY = height * 0.38;
    ctx.fillStyle = '#210903';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    // Temple Mandap Shikhara towers
    for (let x = 0; x < width + 80; x += 90) {
      ctx.lineTo(x + 20, horizonY);
      ctx.lineTo(x + 35, horizonY - 28);
      ctx.lineTo(x + 45, horizonY - 45); // spire peak
      ctx.lineTo(x + 55, horizonY - 28);
      ctx.lineTo(x + 70, horizonY);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Festive hanging fairy light buntoids / Toran across top
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < width; x += 120) {
      ctx.moveTo(x, 10);
      ctx.quadraticCurveTo(x + 60, 32, x + 120, 10);
    }
    ctx.stroke();

    // Little glowing fairy lanterns
    for (let x = 20; x < width; x += 60) {
      const ly = 18 + Math.sin(x * 0.1) * 6;
      ctx.fillStyle = (x % 120 === 0) ? '#fef08a' : '#f97316';
      ctx.beginPath();
      ctx.arc(x, ly, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground Courtyard Floor
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    groundGrad.addColorStop(0, '#2d1408');
    groundGrad.addColorStop(1, '#180702');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);
  }

  /**
   * Render 2.5D Track Perspective, Scenery, Modaks, Obstacles, Mushika, and Ganesha Mandap
   */
  private renderTrackAndEntities(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const horizonY = height * 0.38;
    const centerX = width / 2;
    const trackBottomW = Math.min(width * 0.9, 420);
    const trackTopW = 70;

    // Projection helpers: map (x, z) relative to player into canvas (screenX, screenY, scale)
    const project = (laneX: number, worldZ: number) => {
      const relZ = worldZ - this.playerZ; // distance in front of player
      // Perspective factor: 0 at horizon (far), 1 at camera (near)
      // Player is positioned at relZ = 0 (around screen Y = height * 0.78)
      const viewDist = 550;
      const t = 1 - (relZ + 120) / (viewDist + 120);
      const clampedT = Math.max(0, Math.min(1.2, t));

      const screenY = horizonY + Math.pow(clampedT, 1.4) * (height * 0.78 - horizonY);
      const curTrackW = trackTopW + Math.pow(clampedT, 1.2) * (trackBottomW - trackTopW);
      const screenX = centerX + (laneX / 140) * (curTrackW * 0.44);
      const scale = Math.max(0.2, Math.min(1.4, Math.pow(clampedT, 1.1) * 1.15));

      return { screenX, screenY, scale, relZ, visible: relZ >= -60 && relZ <= viewDist };
    };

    // 1. Draw Paved Paveway
    ctx.save();
    // Perspective Road Polygon
    ctx.fillStyle = '#451a03'; // deep terracotta brick stone
    ctx.beginPath();
    ctx.moveTo(centerX - trackTopW / 2, horizonY);
    ctx.lineTo(centerX + trackTopW / 2, horizonY);
    ctx.lineTo(centerX + trackBottomW / 2, height);
    ctx.lineTo(centerX - trackBottomW / 2, height);
    ctx.closePath();
    ctx.fill();

    // Road side borders (Golden brass / sandstone curb)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(centerX - trackTopW / 2, horizonY);
    ctx.lineTo(centerX - trackBottomW / 2, height);
    ctx.moveTo(centerX + trackTopW / 2, horizonY);
    ctx.lineTo(centerX + trackBottomW / 2, height);
    ctx.stroke();

    // Marigold Petal border ribbons along both sides
    const segCount = 18;
    for (let s = 0; s < segCount; s++) {
      const t1 = s / segCount;
      const t2 = (s + 1) / segCount;
      const y1 = horizonY + Math.pow(t1, 1.4) * (height - horizonY);
      const y2 = horizonY + Math.pow(t2, 1.4) * (height - horizonY);
      const w1 = trackTopW + Math.pow(t1, 1.2) * (trackBottomW - trackTopW);
      const w2 = trackTopW + Math.pow(t2, 1.2) * (trackBottomW - trackTopW);

      ctx.fillStyle = (s % 2 === 0) ? '#f59e0b' : '#ea580c';
      // Left border strip
      ctx.beginPath();
      ctx.moveTo(centerX - w1 / 2 - 8, y1);
      ctx.lineTo(centerX - w1 / 2, y1);
      ctx.lineTo(centerX - w2 / 2, y2);
      ctx.lineTo(centerX - w2 / 2 - 10, y2);
      ctx.closePath();
      ctx.fill();

      // Right border strip
      ctx.beginPath();
      ctx.moveTo(centerX + w1 / 2, y1);
      ctx.lineTo(centerX + w1 / 2 + 8, y1);
      ctx.lineTo(centerX + w2 / 2 + 10, y2);
      ctx.lineTo(centerX + w2 / 2, y2);
      ctx.closePath();
      ctx.fill();
    }

    // Rangoli Medallions stamped dynamically along the endless path every 350 worldZ
    const startRz = Math.max(100, Math.floor((this.playerZ - 100) / 350) * 350);
    const endRz = this.playerZ + 1400;
    for (let rz = startRz; rz <= endRz; rz += 350) {
      const p = project(0, rz);
      if (p.visible && p.scale > 0.3) {
        GameRenderer.drawRangoli(ctx, p.screenX, p.screenY, 36 * p.scale, this.runTime);
      }
    }

    // Glowing Diyas lining the curb borders dynamically every 140 worldZ
    const startDz = Math.max(80, Math.floor((this.playerZ - 100) / 140) * 140);
    const endDz = this.playerZ + 1400;
    for (let dz = startDz; dz <= endDz; dz += 140) {
      const leftP = project(-140, dz);
      if (leftP.visible && leftP.scale > 0.35) {
        GameRenderer.drawDiya(ctx, leftP.screenX - 12 * leftP.scale, leftP.screenY, 11 * leftP.scale, this.runTime);
      }
      const rightP = project(140, dz);
      if (rightP.visible && rightP.scale > 0.35) {
        GameRenderer.drawDiya(ctx, rightP.screenX + 12 * rightP.scale, rightP.screenY, 11 * rightP.scale, this.runTime + 1.2);
      }
    }
    ctx.restore();

    // 2. Render Items & Obstacles sorted by distance (back to front)
    interface RenderableEntity {
      type: 'modak' | 'obstacle';
      z: number;
      data: ModakItem | ObstacleItem;
    }

    const entities: RenderableEntity[] = [];
    for (const m of this.modaks) {
      if (!m.collected) entities.push({ type: 'modak', z: m.z, data: m });
    }
    for (const obs of this.obstacles) {
      entities.push({ type: 'obstacle', z: obs.z, data: obs });
    }

    // Sort far to near (higher worldZ rendered first)
    entities.sort((a, b) => b.z - a.z);

    for (const ent of entities) {
      if (ent.type === 'modak') {
        const modak = ent.data as ModakItem;
        const p = project(modak.laneX, modak.z);
        if (p.visible) {
          const bob = Math.sin(this.runTime * 4 + modak.bobOffset) * 6 * p.scale;
          // Golden radiant aura
          const auraGrad = ctx.createRadialGradient(p.screenX, p.screenY - 14 * p.scale + bob, 2, p.screenX, p.screenY - 14 * p.scale + bob, 24 * p.scale);
          auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
          auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY - 14 * p.scale + bob, 24 * p.scale, 0, Math.PI * 2);
          ctx.fill();

          // Traditional Steamed Modak Vector
          GameRenderer.drawModakVector(ctx, p.screenX, p.screenY - 14 * p.scale + bob, 24 * p.scale);
        }
      } else {
        const obs = ent.data as ObstacleItem;
        const p = project(obs.laneX, obs.z);
        if (p.visible) {
          this.renderObstacle(ctx, obs, p.screenX, p.screenY, p.scale);
        }
      }
    }

    // 3. Lord Vinayakudu's Grand Mandap (always visible far ahead in the distance during run, and close during ending sequence)
    this.renderGaneshaMandap(ctx, project);

    // 4. Render Mushika (Player)
    this.renderMushika(ctx, project);

    // 5. Render Flying Modaks during Offering to Vinayakudu
    if (this.mode === 'OFFERING_TO_GANESHA') {
      this.renderFlyingModaks(ctx, project);
    }
  }

  /**
   * Render Lord Vinayakudu's Grand Festival Mandap
   * Prominently visible in the distance as a visual goal, and close during the ending offering
   */
  private renderGaneshaMandap(
    ctx: CanvasRenderingContext2D,
    project: (x: number, z: number) => { screenX: number; screenY: number; scale: number; visible: boolean }
  ) {
    const isEnding = (this.mode === 'OFFERING_TO_GANESHA' || this.mode === 'RUN_OVER');
    const ganeshaZ = isEnding ? this.endingGaneshaZ : (this.playerZ + 460);
    const p = project(0, ganeshaZ);
    if (!p.visible) return;

    ctx.save();
    ctx.translate(p.screenX, p.screenY);

    // Scale appropriately based on distance:
    // When far away in the distance: p.scale ~ 0.28, mScale ~ 0.35 to 0.45
    // When approached closely in ending sequence: p.scale ~ 0.8, mScale ~ 1.15 to 1.35
    const mScale = isEnding
      ? Math.max(0.6, Math.min(1.4, p.scale * 1.45))
      : Math.max(0.28, Math.min(0.48, p.scale * 1.18));

    // 1. Golden Mandap Arch & Pillars
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

    // Pillar details
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

    // 2. Divine Radiant Halo behind Vinayakudu
    const pulseFactor = (this.mode === 'OFFERING_TO_GANESHA' && this.offeringPhase === 'CELEBRATION')
      ? 1 + Math.sin(this.runTime * 4) * 0.12
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

    // 3. Lord Vinayakudu prominently and respectfully rendered in divine vector grandeur
    GameRenderer.drawDetailedVinayaka(ctx, 0, -80 * mScale, this.runTime, 1.5 * mScale);

    // 4. Offerings Thali pile expansion on Mandap
    if (this.offeredCount > 0) {
      const displayModaks = Math.min(24, this.offeredCount);
      for (let i = 0; i < displayModaks; i++) {
        const ox = ((i % 6) - 2.5) * (7 * mScale);
        const oy = -55 * mScale - Math.floor(i / 6) * (6 * mScale);
        GameRenderer.drawModakVector(ctx, ox, oy, 11 * mScale);
      }
    }

    // 5. Flanking Burning Diyas
    GameRenderer.drawDiya(ctx, -mandapW / 2 - 10 * mScale, -20 * mScale, 18 * mScale, this.runTime);
    GameRenderer.drawDiya(ctx, mandapW / 2 + 10 * mScale, -20 * mScale, 18 * mScale, this.runTime + 1);

    ctx.restore();
  }

  /**
   * Render Modaks flying in arc from Mushika to Vinayakudu's Pooja Thali
   */
  private renderFlyingModaks(
    ctx: CanvasRenderingContext2D,
    project: (x: number, z: number) => { screenX: number; screenY: number; scale: number; visible: boolean }
  ) {
    const ganeshaP = project(0, this.endingGaneshaZ);
    const mushikaP = project(this.playerX, this.playerZ);
    if (!ganeshaP.visible || !mushikaP.visible) return;

    const mScale = Math.max(0.85, ganeshaP.scale * 1.55);
    const targetBaseX = ganeshaP.screenX;
    const targetBaseY = ganeshaP.screenY - 45 * mScale; // Lord Vinayakudu's Pooja Thali
    const startX = mushikaP.screenX + 8;
    const startY = mushikaP.screenY - 20 * mushikaP.scale;

    for (const fm of this.flyingModaks) {
      if (fm.progress > 0 && fm.progress <= 1) {
        const t = fm.progress;
        const curX = startX + (targetBaseX + fm.targetX * mScale - startX) * t;
        const arcH = Math.sin(t * Math.PI) * 95;
        const curY = startY + (targetBaseY + fm.targetY * mScale - startY) * t - arcH;

        // Glowing particle trail
        ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
        ctx.beginPath();
        ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Modak Vector
        GameRenderer.drawModakVector(ctx, curX, curY, 20 * fm.scale);
      }
    }
  }

  /**
   * Render Ending Offering HUD banner and falling flower petals
   */
  private renderEndingOfferingHUD(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Render flower petals falling over scene
    for (const petal of this.flowerPetals) {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rot);
      ctx.fillStyle = petal.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Top Festive Banner
    const bannerW = Math.min(width * 0.92, 470);
    const bannerH = 76;
    const bannerX = width / 2 - bannerW / 2;
    const bannerY = 24;

    ctx.save();
    ctx.fillStyle = 'rgba(28, 10, 4, 0.88)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.offeringPhase === 'APPROACH') {
      ctx.font = 'bold 15px Cinzel, serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('APPROACHING LORD VINAYAKUDU 🕉️', width / 2, bannerY + 26);
      ctx.font = '13px Outfit, sans-serif';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText('Mushika arrives before the divine festive mandap...', width / 2, bannerY + 50);
    } else if (this.offeringPhase === 'OFFERING') {
      ctx.font = 'bold 16px Cinzel, serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`OFFERING SACRED MODAKS: 🥟 ${this.offeredCount} / ${this.modaksCollected}`, width / 2, bannerY + 26);

      // Small golden progress bar
      const pW = bannerW - 60;
      const pH = 8;
      const pX = width / 2 - pW / 2;
      const pY = bannerY + 48;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(pX, pY, pW, pH);
      const ratio = this.modaksCollected > 0 ? (this.offeredCount / this.modaksCollected) : 1;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(pX, pY, pW * ratio, pH);
    } else if (this.offeringPhase === 'CELEBRATION') {
      ctx.font = 'bold 16px Cinzel, serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(
        this.modaksCollected > 0
          ? `🕉️ ALL ${this.modaksCollected} MODAKS SACREDLY OFFERED! 🥟`
          : '🕉️ DEVOTION ACCEPTED BY VINAYAKUDU! 🌸',
        width / 2,
        bannerY + 26
      );
      ctx.font = '13px Outfit, sans-serif';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText('Lord Vinayakudu showers Mushika with eternal divine blessings!', width / 2, bannerY + 50);
    }

    ctx.restore();
  }

  /**
   * Render an Obstacle (Stone, Wooden Block, Brass Pot, or Barrier)
   */
  private renderObstacle(
    ctx: CanvasRenderingContext2D,
    obs: ObstacleItem,
    x: number,
    y: number,
    scale: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 4 * scale, obs.width * 0.55 * scale, obs.height * 0.25 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (obs.type) {
      case 'stone': {
        // Natural grey-slate river boulder with moss speckles
        ctx.fillStyle = '#57534e';
        ctx.beginPath();
        ctx.ellipse(0, -obs.height * 0.4 * scale, obs.width * 0.48 * scale, obs.height * 0.42 * scale, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();

        // Stone highlight
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.ellipse(-obs.width * 0.15 * scale, -obs.height * 0.55 * scale, obs.width * 0.22 * scale, obs.height * 0.16 * scale, -0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'wood_block': {
        // Sandalwood festival wooden crate / block
        const w = obs.width * scale;
        const h = obs.height * scale;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-w / 2, -h, w, h);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(-w / 2, -h, w, h);

        // Cross wood braces
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h);
        ctx.lineTo(w / 2, 0);
        ctx.stroke();
        break;
      }

      case 'brass_pot': {
        // Sacred brass Kalash / pot with coconut topper
        const r = (obs.width / 2) * scale;
        // Brass body
        const brassGrad = ctx.createLinearGradient(-r, 0, r, 0);
        brassGrad.addColorStop(0, '#ca8a04');
        brassGrad.addColorStop(0.5, '#fef08a');
        brassGrad.addColorStop(1, '#a16207');
        ctx.fillStyle = brassGrad;
        ctx.beginPath();
        ctx.arc(0, -r, r, 0, Math.PI * 2);
        ctx.fill();

        // Pot neck & rim
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-r * 0.6, -r * 1.6, r * 1.2, r * 0.6);

        // Sacred Coconut on top
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, -r * 1.7, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'barrier': {
        // Wooden festival barrier with red/gold ribbons
        const bw = obs.width * scale;
        const bh = obs.height * scale;
        // Posts
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-bw / 2, -bh, 6 * scale, bh);
        ctx.fillRect(bw / 2 - 6 * scale, -bh, 6 * scale, bh);

        // Horizontal rail
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-bw / 2, -bh * 0.7, bw, 7 * scale);
        // Warning diagonal festive stripes (marigold/vermillion)
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-bw * 0.25, -bh * 0.7, 6 * scale, 7 * scale);
        ctx.fillRect(bw * 0.15, -bh * 0.7, 6 * scale, 7 * scale);
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Render Mushika (Player character)
   * Adorable mouse vahana with scampering paws, pink ears, tail, tilak, and saffron sash
   */
  private renderMushika(
    ctx: CanvasRenderingContext2D,
    project: (x: number, z: number) => { screenX: number; screenY: number; scale: number }
  ) {
    const p = project(this.playerX, this.playerZ);

    ctx.save();
    ctx.translate(p.screenX, p.screenY);

    // Invulnerability blinking
    if (this.isInvulnerable && Math.floor(this.runTime * 14) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    const scale = p.scale * 1.2;
    const isRunning = this.mode === 'RUNNING' || (this.mode === 'OFFERING_TO_GANESHA' && this.offeringPhase === 'APPROACH');
    // Run cycle animation frequency speeds up slightly as Mushika's running speed increases
    const animRate = isRunning ? Math.min(26, 12 + (this.currentSpeed / 20)) : 0;
    const runCycle = this.runTime * animRate;
    const legSwing = Math.sin(runCycle) * 7 * scale;
    const celebrationHop = (this.mode === 'OFFERING_TO_GANESHA' && this.offeringPhase === 'CELEBRATION') ? this.mushikaHopY : 0;
    const bodyBob = Math.abs(Math.sin(runCycle)) * 3 * scale + celebrationHop;

    // 1. Soft ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 4 * scale, 24 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Swishing Tail (curved elegant whip)
    const tailWag = Math.sin(this.runTime * 10) * 8 * scale;
    ctx.strokeStyle = '#e7e5e4'; // pale pinkish mouse tail
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14 * scale, -6 * scale - bodyBob);
    ctx.quadraticCurveTo(-26 * scale, -18 * scale - bodyBob + tailWag, -22 * scale + tailWag * 0.5, -28 * scale);
    ctx.stroke();

    // 3. Four scampering pink paws
    ctx.fillStyle = '#fbcfe8'; // soft mouse paws
    // Rear left & right paws
    ctx.beginPath();
    ctx.ellipse(-10 * scale, -bodyBob + legSwing, 4 * scale, 6 * scale, 0.2, 0, Math.PI * 2);
    ctx.ellipse(-4 * scale, -bodyBob - legSwing, 4 * scale, 6 * scale, -0.2, 0, Math.PI * 2);
    // Front paws
    ctx.ellipse(8 * scale, -bodyBob - legSwing, 4 * scale, 5 * scale, 0.2, 0, Math.PI * 2);
    ctx.ellipse(14 * scale, -bodyBob + legSwing, 4 * scale, 5 * scale, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Mouse Body (Silver-grey rounded mouse torso)
    const bodyGrad = ctx.createLinearGradient(0, -26 * scale, 0, 0);
    bodyGrad.addColorStop(0, '#e7e5e4');
    bodyGrad.addColorStop(0.5, '#a8a29e');
    bodyGrad.addColorStop(1, '#78716c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, -12 * scale - bodyBob, 18 * scale, 13 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // 5. Festive Saffron Waist Sash / Dhoti wrap
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(-1 * scale, -11 * scale - bodyBob, 8 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24'; // golden border
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();

    // 6. Cute Mouse Head & Snout (facing forward/slightly up)
    const headGrad = ctx.createRadialGradient(8 * scale, -22 * scale - bodyBob, 2, 8 * scale, -22 * scale - bodyBob, 15 * scale);
    headGrad.addColorStop(0, '#f5f5f4');
    headGrad.addColorStop(1, '#a8a29e');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(8 * scale, -22 * scale - bodyBob, 11 * scale, 10 * scale, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Tapered snout
    ctx.beginPath();
    ctx.moveTo(14 * scale, -26 * scale - bodyBob);
    ctx.lineTo(24 * scale, -21 * scale - bodyBob);
    ctx.lineTo(14 * scale, -17 * scale - bodyBob);
    ctx.closePath();
    ctx.fill();

    // Pink nose tip
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(24 * scale, -21 * scale - bodyBob, 2.2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Dark shiny eye
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(10 * scale, -23 * scale - bodyBob, 2.4 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Eye glimmer
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(11 * scale, -24 * scale - bodyBob, 0.8 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Twitching Whiskers
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 0.8 * scale;
    ctx.beginPath();
    ctx.moveTo(21 * scale, -21 * scale - bodyBob);
    ctx.lineTo(31 * scale, -25 * scale - bodyBob);
    ctx.moveTo(21 * scale, -20 * scale - bodyBob);
    ctx.lineTo(32 * scale, -18 * scale - bodyBob);
    ctx.stroke();

    // 7. Large Rounded Ears (Outer grey + inner baby pink)
    // Left ear
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.arc(4 * scale, -30 * scale - bodyBob, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(4 * scale, -30 * scale - bodyBob, 4.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.arc(14 * scale, -31 * scale - bodyBob, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(14 * scale, -31 * scale - bodyBob, 4.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // 8. Sacred Red Tilak on forehead
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(10 * scale, -26 * scale - bodyBob, 1.2 * scale, 2.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render Top HUD (Modaks, Score, Hearts, Survival distance/time, and Mobile buttons)
   */
  private renderHUD(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    // Top Header Bar
    const pad = 16;
    const barH = 46;

    // 1. Modaks Counter (Top Left) - Unlimited continuous collection
    const modakBoxW = 145;
    ctx.fillStyle = 'rgba(62, 48, 40, 0.9)';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pad, pad, modakBoxW, barH, 12);
    ctx.fill();
    ctx.stroke();

    // Modak icon vector inside HUD
    GameRenderer.drawModakVector(ctx, pad + 22, pad + barH / 2, 18);

    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`MODAKS: ${this.modaksCollected}`, pad + 38, pad + barH / 2);

    // 2. Score (Top Center)
    ctx.fillStyle = 'rgba(62, 48, 40, 0.9)';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 75, pad, 150, barH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E8C766';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', width / 2, pad + 15);
    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText(`${this.score}`, width / 2, pad + 33);

    // 3. Lives / Hearts (Top Right) - 5 Hearts
    const heartsBoxW = 150;
    ctx.beginPath();
    ctx.roundRect(width - pad - heartsBoxW, pad, heartsBoxW, barH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let heartsStr = '';
    for (let h = 0; h < this.maxLives; h++) {
      heartsStr += h < this.lives ? '❤️ ' : '🖤 ';
    }
    ctx.fillText(heartsStr.trim(), width - pad - heartsBoxW / 2, pad + barH / 2);

    // 4. Survival Tracker Pill (Distance, Time, Speed)
    const pillW = Math.min(width - pad * 2, 320);
    const pillY = pad + barH + 6;
    ctx.fillStyle = 'rgba(36, 74, 58, 0.85)';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width / 2 - pillW / 2, pillY, pillW, 22, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const distM = Math.floor(this.playerZ / 10);
    const speedVal = Math.round(this.currentSpeed);
    ctx.fillText(`🏃 ${distM}m  •  ⏱️ ${Math.floor(this.timeElapsed)}s  •  ⚡ ${speedVal} px/s`, width / 2, pillY + 11);

    // 5. Mobile Left & Right Touch Buttons
    this.renderMobileControls(ctx, width, height);

    ctx.restore();
  }

  /**
   * Render Large, tactile Left and Right Touch Buttons for mobile
   */
  private renderMobileControls(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const btnSize = 64;
    const pad = 20;
    const btnY = height - pad - btnSize;

    // Left Button (◀)
    const leftX = pad;
    ctx.save();
    ctx.fillStyle = this.touchSteerLeft ? 'rgba(201, 130, 50, 0.65)' : 'rgba(62, 48, 40, 0.75)';
    ctx.strokeStyle = this.touchSteerLeft ? '#E8C766' : '#C6A15B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(leftX, btnY, btnSize, btnSize, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.touchSteerLeft ? '#ffffff' : '#F6EBD8';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◀', leftX + btnSize / 2, btnY + btnSize / 2);
    ctx.restore();

    // Right Button (▶)
    const rightX = width - pad - btnSize;
    ctx.save();
    ctx.fillStyle = this.touchSteerRight ? 'rgba(201, 130, 50, 0.65)' : 'rgba(62, 48, 40, 0.75)';
    ctx.strokeStyle = this.touchSteerRight ? '#E8C766' : '#C6A15B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(rightX, btnY, btnSize, btnSize, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.touchSteerRight ? '#ffffff' : '#F6EBD8';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶', rightX + btnSize / 2, btnY + btnSize / 2);
    ctx.restore();
  }

  /**
   * Start Screen / Instructions Screen (Landscape-first responsive)
   */
  private renderInstructionsScreen(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    // Backdrop dim
    ctx.fillStyle = 'rgba(62, 48, 40, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const isLandscape = width >= height || width >= 600;
    const cardW = isLandscape ? Math.min(width * 0.9, 680) : Math.min(width * 0.92, 420);
    const cardH = isLandscape ? Math.min(height * 0.88, 380) : Math.min(height * 0.88, 490);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;

    // Card background with rich festival maroon-brown gradient
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    cardGrad.addColorStop(0, '#7A2E2E'); // Maroon
    cardGrad.addColorStop(0.5, '#3E3028'); // Brown
    cardGrad.addColorStop(1, '#244A3A'); // Forest green
    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = '#C6A15B'; // Gold border
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (isLandscape) {
      // 2-Column Landscape Layout
      const leftW = Math.floor(cardW * 0.40);
      const rightX = cardX + leftW + 16;
      const rightW = cardW - leftW - 32;

      // Left Column: Emblem, Title, Subtitle, Why Button
      const leftCenterX = cardX + leftW / 2 + 10;
      ctx.fillStyle = 'rgba(198, 161, 91, 0.2)';
      ctx.beginPath();
      ctx.arc(leftCenterX, cardY + 54, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E8C766';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐭', leftCenterX, cardY + 54);

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 24px Cinzel, serif';
      ctx.fillText('MUSHIKA RUN', leftCenterX, cardY + 102);

      ctx.fillStyle = '#E8C766';
      ctx.font = '600 12px Outfit, sans-serif';
      ctx.fillText('Sacred Endless Run', leftCenterX, cardY + 128);

      // Left Column: Why This Game Button
      const whyW = leftW - 20;
      const whyH = 34;
      const whyX = cardX + 16;
      const whyY = cardY + cardH - whyH - 24;
      this.instructionsWhyBtn = { x: whyX, y: whyY, w: whyW, h: whyH };

      ctx.fillStyle = 'rgba(201, 130, 50, 0.25)';
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(whyX, whyY, whyW, whyH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📖 WHY THIS GAME?', whyX + whyW / 2, whyY + whyH / 2);

      // Right Column: Rules Box
      const boxY = cardY + 24;
      const boxH = cardH - 96;
      ctx.fillStyle = 'rgba(36, 74, 58, 0.65)';
      ctx.strokeStyle = 'rgba(198, 161, 91, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rightX, boxY, rightW, boxH, 14);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 12px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('CONTROLS & SURVIVAL', rightX + 18, boxY + 26);

      ctx.font = '13px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText('• Desktop: Arrow keys / A-D to steer', rightX + 18, boxY + 50);
      ctx.fillText('• Mobile: Large left & right touch buttons', rightX + 18, boxY + 74);
      ctx.fillText('• Collect unlimited Modaks along the trail', rightX + 18, boxY + 98);
      ctx.fillText('• 5 Sacred Hearts (❤️❤️❤️❤️❤️) — speed ramps up!', rightX + 18, boxY + 122);

      // Right Column: Action Row (Return + Start)
      const btnH = 44;
      const btnY = cardY + cardH - btnH - 22;
      const retW = 120;
      const startW = rightW - retW - 12;
      const retX = rightX;
      const startX = rightX + retW + 12;

      this.instructionsReturnBtn = { x: retX, y: btnY, w: retW, h: btnH };
      this.instructionsStartBtn = { x: startX, y: btnY, w: startW, h: btnH };

      // Return Button
      ctx.fillStyle = 'rgba(62, 48, 40, 0.7)';
      ctx.strokeStyle = '#C6A15B';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(retX, btnY, retW, btnH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('← World', retX + retW / 2, btnY + btnH / 2);

      // Start Button
      const sGrad = ctx.createLinearGradient(startX, btnY, startX + startW, btnY);
      sGrad.addColorStop(0, '#C98232'); // Saffron
      sGrad.addColorStop(1, '#A85F3D'); // Terracotta
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.roundRect(startX, btnY, startW, btnH, 12);
      ctx.fill();
      ctx.strokeStyle = '#E8C766';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 15px Cinzel, serif';
      ctx.fillText('START RUN ▶', startX + startW / 2, btnY + btnH / 2);

    } else {
      // Portrait Fallback
      ctx.fillStyle = 'rgba(198, 161, 91, 0.2)';
      ctx.beginPath();
      ctx.arc(width / 2, cardY + 44, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E8C766';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐭', width / 2, cardY + 44);

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 22px Cinzel, serif';
      ctx.fillText('MUSHIKA RUN', width / 2, cardY + 88);

      ctx.fillStyle = '#E8C766';
      ctx.font = '600 12px Outfit, sans-serif';
      ctx.fillText('Endless Survival: Help Mushika collect Modaks!', width / 2, cardY + 112);

      // Controls Box
      const boxY = cardY + 128;
      const boxH = 135;
      ctx.fillStyle = 'rgba(36, 74, 58, 0.65)';
      ctx.strokeStyle = 'rgba(198, 161, 91, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cardX + 20, boxY, cardW - 40, boxH, 14);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('CONTROLS & SURVIVAL', cardX + 34, boxY + 24);

      ctx.font = '12px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText('• Desktop: Arrow keys / A-D to steer', cardX + 34, boxY + 46);
      ctx.fillText('• Mobile: Large left & right touch buttons', cardX + 34, boxY + 68);
      ctx.fillText('• Collect unlimited Modaks along the trail', cardX + 34, boxY + 90);
      ctx.fillText('• 5 Sacred Hearts (❤️❤️❤️❤️❤️)', cardX + 34, boxY + 112);

      // Start button
      const btnW = cardW - 40;
      const btnH = 46;
      const btnY = cardY + cardH - 100;
      const btnX = cardX + 20;
      this.instructionsStartBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

      const sGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
      sGrad.addColorStop(0, '#C98232');
      sGrad.addColorStop(1, '#A85F3D');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 14);
      ctx.fill();
      ctx.strokeStyle = '#E8C766';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#F6EBD8';
      ctx.font = 'bold 15px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('START RUN ▶', width / 2, btnY + btnH / 2);

      // Links: Return + Why
      const linkY = cardY + cardH - 34;
      this.instructionsReturnBtn = { x: cardX + 20, y: linkY - 14, w: 120, h: 28 };
      this.instructionsWhyBtn = { x: cardX + cardW - 150, y: linkY - 14, w: 130, h: 28 };

      ctx.font = '500 12px Outfit, sans-serif';
      ctx.fillStyle = '#E8C766';
      ctx.textAlign = 'left';
      ctx.fillText('← Return to World', cardX + 20, linkY);

      ctx.textAlign = 'right';
      ctx.fillText('📖 Why This Game?', cardX + cardW - 20, linkY);
    }

    // Optional Modal: "WHY THIS GAME?" Popover
    if (this.showWhyModal) {
      this.renderWhyModal(ctx, width, height);
    }

    ctx.restore();
  }

  /**
   * Render "WHY THIS GAME?" story popup (Landscape-first)
   */
  private renderWhyModal(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = 'rgba(62, 48, 40, 0.92)';
    ctx.fillRect(0, 0, width, height);

    const mw = Math.min(width * 0.88, 480);
    const mh = Math.min(height * 0.82, 230);
    const mx = (width - mw) / 2;
    const my = (height - mh) / 2;

    ctx.fillStyle = '#7A2E2E'; // Maroon
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 16);
    ctx.fill();
    ctx.strokeStyle = '#C6A15B'; // Gold
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '24px sans-serif';
    ctx.fillText('🐭', width / 2, my + 30);

    ctx.font = 'bold 16px Cinzel, serif';
    ctx.fillStyle = '#E8C766';
    ctx.fillText('WHY THIS GAME?', width / 2, my + 62);

    ctx.font = '13px Outfit, sans-serif';
    ctx.fillStyle = '#F6EBD8';
    ctx.fillText("Mushika is Lord Ganesha's loyal vahana (divine vehicle).", width / 2, my + 94);
    ctx.fillText("Though small, Mushika is nimble and clever, helping Ganesha", width / 2, my + 116);
    ctx.fillText("gather sacred offerings and overcome any obstacle with joy.", width / 2, my + 138);

    // Close Button
    const cbW = 120;
    const cbH = 34;
    const cbX = width / 2 - cbW / 2;
    const cbY = my + mh - 44;
    this.whyModalCloseBtn = { x: cbX, y: cbY, w: cbW, h: cbH };

    ctx.fillStyle = '#C98232';
    ctx.beginPath();
    ctx.roundRect(cbX, cbY, cbW, cbH, 10);
    ctx.fill();
    ctx.strokeStyle = '#E8C766';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillText('CLOSE', width / 2, cbY + cbH / 2);
  }

  /**
   * Countdown Screen (3-2-1-GO!)
   */
  private renderCountdownOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    // Dramatic pulse scale
    const scale = 1 + (0.8 - this.countdownTimer) * 0.4;
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);

    ctx.font = 'bold 84px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(this.countdownText, 4, 4);

    const grad = ctx.createLinearGradient(0, -40, 0, 40);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillText(this.countdownText, 0, 0);

    ctx.restore();
  }

  /**
   * Run Over / Game Over Screen (Landscape-first 2x2 stats layout)
   */
  private renderRunOverScreen(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(62, 48, 40, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const isLandscape = width >= height || width >= 600;
    const cardW = isLandscape ? Math.min(width * 0.88, 640) : Math.min(width * 0.92, 420);
    const cardH = isLandscape ? Math.min(height * 0.88, 350) : Math.min(height * 0.88, 460);
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;

    // Card background
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    cardGrad.addColorStop(0, '#7A2E2E'); // Maroon
    cardGrad.addColorStop(0.5, '#3E3028'); // Brown
    cardGrad.addColorStop(1, '#244A3A'); // Forest Green
    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Top Title
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐭', width / 2, cardY + 34);

    ctx.fillStyle = '#E8C766';
    ctx.font = 'bold 24px Cinzel, serif';
    ctx.fillText('RUN OVER', width / 2, cardY + 66);

    ctx.fillStyle = '#F6EBD8';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText('Mushika completed a courageous run through the festival trail!', width / 2, cardY + 90);

    // 2x2 Stats Grid
    const sBoxY = cardY + 108;
    const sBoxH = isLandscape ? 124 : 170;
    ctx.fillStyle = 'rgba(36, 74, 58, 0.55)';
    ctx.strokeStyle = 'rgba(198, 161, 91, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX + 20, sBoxY, cardW - 40, sBoxH, 14);
    ctx.fill();
    ctx.stroke();

    if (isLandscape) {
      // 2 Columns in Landscape
      const colW = (cardW - 60) / 2;
      const col1X = cardX + 30;
      const col2X = cardX + 30 + colW + 10;

      // Row 1
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('MODAKS COLLECTED:', col1X, sBoxY + 32);
      ctx.textAlign = 'right';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText(`🥟 ${this.modaksCollected}`, col1X + colW - 10, sBoxY + 32);

      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('FINAL SCORE:', col2X, sBoxY + 32);
      ctx.textAlign = 'right';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText(`🏆 ${this.score}`, col2X + colW - 10, sBoxY + 32);

      // Row 2
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('SURVIVAL TIME:', col1X, sBoxY + 76);
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText(`⏱️ ${formatSurvivalTime(this.timeElapsed)}`, col1X + colW - 10, sBoxY + 76);

      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('DISTANCE RUN:', col2X, sBoxY + 76);
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText(`🏃 ${Math.floor(this.playerZ / 10)}m`, col2X + colW - 10, sBoxY + 76);
    } else {
      // 4 Rows in Portrait
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('MODAKS COLLECTED:', cardX + 36, sBoxY + 28);
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText(`🥟 ${this.modaksCollected}`, cardX + cardW - 36, sBoxY + 28);

      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('FINAL SCORE:', cardX + 36, sBoxY + 64);
      ctx.textAlign = 'right';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText(`🏆 ${this.score}`, cardX + cardW - 36, sBoxY + 64);

      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('SURVIVAL TIME:', cardX + 36, sBoxY + 100);
      ctx.textAlign = 'right';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText(`⏱️ ${formatSurvivalTime(this.timeElapsed)}`, cardX + cardW - 36, sBoxY + 100);

      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.fillStyle = '#E8C766';
      ctx.fillText('DISTANCE RUN:', cardX + 36, sBoxY + 136);
      ctx.textAlign = 'right';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillStyle = '#F6EBD8';
      ctx.fillText(`🏃 ${Math.floor(this.playerZ / 10)}m`, cardX + cardW - 36, sBoxY + 136);
    }

    // Action Buttons: PLAY AGAIN and RETURN TO WORLD
    const bW = (cardW - 56) / 2;
    const bH = 44;
    const bY = cardY + cardH - bH - 18;

    this.runOverPlayAgainBtn = { x: cardX + 20, y: bY, w: bW, h: bH };
    this.runOverReturnBtn = { x: cardX + 36 + bW, y: bY, w: bW, h: bH };

    // Play Again Button
    const pGrad = ctx.createLinearGradient(cardX + 20, bY, cardX + 20 + bW, bY);
    pGrad.addColorStop(0, '#C98232');
    pGrad.addColorStop(1, '#A85F3D');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(cardX + 20, bY, bW, bH, 12);
    ctx.fill();
    ctx.strokeStyle = '#E8C766';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLAY AGAIN ↺', cardX + 20 + bW / 2, bY + bH / 2);

    // Return to World Button
    ctx.fillStyle = 'rgba(62, 48, 40, 0.7)';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(cardX + 36 + bW, bY, bW, bH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillText('RETURN TO WORLD', cardX + 36 + bW + bW / 2, bY + bH / 2);

    ctx.restore();
  }

  /**
   * Pointer Click / Touch Handling for Menus, Buttons, and Touch Steering
   */
  public handlePointerDown(x: number, y: number, width: number, height: number): boolean {
    // 1. Mobile Steer Buttons during RUNNING
    if (this.mode === 'RUNNING') {
      const btnSize = 68;
      const pad = 20;
      const btnY = height - pad - btnSize;

      // Left button tap
      if (x >= pad && x <= pad + btnSize && y >= btnY && y <= btnY + btnSize) {
        this.touchSteerLeft = true;
        return true;
      }
      // Right button tap
      if (x >= width - pad - btnSize && x <= width - pad && y >= btnY && y <= btnY + btnSize) {
        this.touchSteerRight = true;
        return true;
      }

      // Also support direct screen half tapping for steering
      if (x < width * 0.35) {
        this.touchSteerLeft = true;
        return true;
      } else if (x > width * 0.65) {
        this.touchSteerRight = true;
        return true;
      }
    }

    // 2. Start Screen Click
    if (this.mode === 'INSTRUCTIONS') {
      if (this.showWhyModal) {
        const b = this.whyModalCloseBtn;
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          soundEngine.playClick();
          this.showWhyModal = false;
          return true;
        }
        // Clicking outside also closes modal
        this.showWhyModal = false;
        return true;
      }

      // Start Run button
      const s = this.instructionsStartBtn;
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
        soundEngine.playEnterChapter();
        this.startCountdown();
        return true;
      }

      // Return to World button
      const r = this.instructionsReturnBtn;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        soundEngine.playClick();
        this.onReturnToWorldCallback();
        return true;
      }

      // WHY THIS GAME? button
      const w = this.instructionsWhyBtn;
      if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) {
        soundEngine.playClick();
        this.showWhyModal = true;
        return true;
      }
    }

    // 3. GAME OVER (RUN_OVER) Screen Buttons
    if (this.mode === 'RUN_OVER') {
      // Play Again
      const pa = this.runOverPlayAgainBtn;
      if (x >= pa.x && x <= pa.x + pa.w && y >= pa.y && y <= pa.y + pa.h) {
        soundEngine.playEnterChapter();
        this.reset();
        this.startCountdown();
        return true;
      }

      // Return to World
      const ret = this.runOverReturnBtn;
      if (x >= ret.x && x <= ret.x + ret.w && y >= ret.y && y <= ret.y + ret.h) {
        soundEngine.playTempleBell(1.0);
        this.onReturnToWorldCallback();
        return true;
      }
    }

    return false;
  }

  /**
   * Pointer Up / Release Touch Steering
   */
  public handlePointerUp() {
    this.touchSteerLeft = false;
    this.touchSteerRight = false;
  }

  /**
   * Set Steering Direction (-1, 0, or 1)
   */
  public setSteering(dir: number) {
    this.steeringInput = dir;
  }
}
