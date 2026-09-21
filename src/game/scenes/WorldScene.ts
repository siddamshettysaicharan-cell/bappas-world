/**
 * Playable 2D Ganesha World Hub Scene
 * The player explores the vibrant festival village courtyard, visits the sacred Mandap,
 * and enters physical story pavilions.
 * 
 * Features:
 * - 100% Rock-Solid Stable World & Camera (zero wobble, zero jitter, locked viewport)
 * - Continuous Camera Zoom-Out Journey from Cinematic Darshan into the Village
 * - Responsive 2D Game Movement (WASD / Arrows / Virtual Joystick / Point-to-walk)
 * - Smooth Obstacle Sliding around Mandap and Story Pavilions
 * - 4-Directional Player Avatar with Walk Cycle Animation
 * - Minimal Game-Style In-World Interaction Prompts
 */

import { soundEngine } from '../../audio/soundEngine';
import { ChapterId, Particle, PlayerAvatar, WorldLandmark } from '../../types';
import { WORLD_BOUNDS, WORLD_LANDMARKS } from '../constants';
import { GameRenderer } from '../renderer';

export class WorldScene {
  public player: PlayerAvatar;
  public camera = { x: 0, y: 0 };
  public cameraZoom: number = 1.0;
  public cameraFocus = { x: 640, y: 400 };
  public isPlayable: boolean = true;

  // Seamless Camera Transition State from Cinematic Intro
  public isRevealing: boolean = false;
  public revealTimer: number = 0;
  public revealDuration: number = 1.6;
  public revealProgress: number = 1.0;

  // Player physics velocity
  private playerVx: number = 0;
  private playerVy: number = 0;
  private hasDirectionInput: boolean = false;
  private inputDir = { dx: 0, dy: 0 };

  private time: number = 0;
  private particles: Particle[] = [];
  private screenPetals: Array<{ x: number; y: number; vx: number; vy: number; rot: number; vrot: number; size: number; color: string }> = [];
  private lightMotes: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number }> = [];

  public activePromptLandmark: WorldLandmark | null = null;
  private onEnterChapter: (chapterId: ChapterId) => void;

  constructor(onEnterChapter: (chapterId: ChapterId) => void) {
    this.onEnterChapter = onEnterChapter;
    // Spawn player in front of the Central Mandap, facing the courtyard
    this.player = {
      x: WORLD_BOUNDS.centerMandap.x,
      y: WORLD_BOUNDS.centerMandap.y + 110,
      targetX: WORLD_BOUNDS.centerMandap.x,
      targetY: WORLD_BOUNDS.centerMandap.y + 110,
      speed: 210,
      size: 26,
      facing: 'down',
      isMoving: false,
      stepCycle: 0,
    };
    this.cameraFocus = { x: WORLD_BOUNDS.width / 2, y: WORLD_BOUNDS.height / 2 };
    this.initAmbience();
    this.initScreenAtmosphere();
  }

  /**
   * Transition into the World - loads the full world, mandap, and environment immediately
   */
  public startRevealFromMandap() {
    this.isRevealing = false;
    this.revealTimer = 0;
    this.revealDuration = 0;
    this.revealProgress = 1.0;
    this.isPlayable = true;

    // Center camera on the village world
    this.cameraFocus.x = WORLD_BOUNDS.width / 2;
    this.cameraFocus.y = WORLD_BOUNDS.height / 2;
    this.cameraZoom = 1.0;

    // Position player reverently in front of the Mandap, facing the courtyard
    this.player.x = WORLD_BOUNDS.centerMandap.x;
    this.player.y = WORLD_BOUNDS.centerMandap.y + 115;
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
    this.player.facing = 'down';
    this.player.isMoving = false;
    this.player.stepCycle = 0;
    this.playerVx = 0;
    this.playerVy = 0;
    this.hasDirectionInput = false;

    soundEngine.playTempleBell(1.2);
  }

  private initAmbience() {
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * WORLD_BOUNDS.width,
        y: Math.random() * WORLD_BOUNDS.height,
        vx: -0.3 + Math.random() * 0.6,
        vy: 0.4 + Math.random() * 0.6,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#f59e0b' : '#f97316',
        alpha: 0.3 + Math.random() * 0.4,
        life: 0,
        maxLife: 100,
      });
    }
  }

  private initScreenAtmosphere() {
    this.screenPetals = [];
    for (let i = 0; i < 22; i++) {
      this.screenPetals.push({
        x: Math.random() * 1280,
        y: Math.random() * 800,
        vx: -0.4 + Math.random() * 0.8,
        vy: 0.6 + Math.random() * 0.8,
        rot: Math.random() * Math.PI * 2,
        vrot: -0.02 + Math.random() * 0.04,
        size: 4 + Math.random() * 4,
        color: Math.random() > 0.4 ? '#ea580c' : '#facc15',
      });
    }

    this.lightMotes = [];
    for (let i = 0; i < 28; i++) {
      this.lightMotes.push({
        x: Math.random() * 1280,
        y: Math.random() * 800,
        vx: -0.2 + Math.random() * 0.4,
        vy: -0.3 - Math.random() * 0.4,
        alpha: 0.2 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  /**
   * Set tap / click walk destination
   */
  public setMoveTarget(worldX: number, worldY: number) {
    if (this.isRevealing) {
      this.isRevealing = false;
      this.isPlayable = true;
      this.revealTimer = this.revealDuration;
      this.revealProgress = 1;
      this.player.facing = 'down';
    }
    if (!this.isPlayable) return;
    this.player.targetX = Math.max(45, Math.min(WORLD_BOUNDS.width - 45, worldX));
    this.player.targetY = Math.max(45, Math.min(WORLD_BOUNDS.height - 45, worldY));
    this.hasDirectionInput = false;
  }

  /**
   * Set active directional input from WASD, Arrow keys or Virtual Joystick
   */
  public moveByDirection(dx: number, dy: number, _dt: number) {
    if (this.isRevealing && (dx !== 0 || dy !== 0)) {
      this.isRevealing = false;
      this.isPlayable = true;
      this.revealTimer = this.revealDuration;
      this.revealProgress = 1;
      this.player.facing = 'down';
    }
    if (!this.isPlayable) return;

    if (dx === 0 && dy === 0) {
      this.hasDirectionInput = false;
      this.inputDir = { dx: 0, dy: 0 };
      return;
    }

    const len = Math.hypot(dx, dy);
    this.inputDir = { dx: dx / len, dy: dy / len };
    this.hasDirectionInput = true;
    // Cancel tap-to-move target
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
  }

  /**
   * Stop all ongoing movement (direction keys, tap destination, velocities)
   */
  public stopAllMovement() {
    this.hasDirectionInput = false;
    this.inputDir = { dx: 0, dy: 0 };
    this.playerVx = 0;
    this.playerVy = 0;
    this.player.isMoving = false;
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
  }

  /**
   * Compute base zoom level that comfortably frames the entire festival village
   */
  public calculateBaseZoom(viewportW: number, viewportH: number): number {
    if (!viewportW || !viewportH) return 1.0;
    // In landscape and all viewports, fit the full 1280x800 festival village inside the screen
    const marginX = 20;
    const marginY = 56; // Leave space for the top HUD bar
    const fitX = (viewportW - marginX) / WORLD_BOUNDS.width;
    const fitY = (viewportH - marginY) / WORLD_BOUNDS.height;
    return Math.min(fitX, fitY);
  }

  /**
   * Resolve obstacle collisions so player slides naturally around structures
   */
  private resolveCollisions(newX: number, newY: number): { x: number; y: number } {
    let x = newX;
    let y = newY;

    // 1. Central Mandap Base Obstacle (radius 92)
    const mandap = WORLD_BOUNDS.centerMandap;
    const distToMandap = Math.hypot(x - mandap.x, y - mandap.y);
    const mandapRadius = 92;
    if (distToMandap < mandapRadius) {
      const angle = Math.atan2(y - mandap.y, x - mandap.x);
      x = mandap.x + Math.cos(angle) * mandapRadius;
      y = mandap.y + Math.sin(angle) * mandapRadius;
    }

    // 2. Story Pavilion Bases
    for (const lm of WORLD_LANDMARKS) {
      const distToLm = Math.hypot(x - lm.x, y - lm.y);
      const lmRadius = lm.radius * 0.62;
      if (distToLm < lmRadius) {
        const angle = Math.atan2(y - lm.y, x - lm.x);
        x = lm.x + Math.cos(angle) * lmRadius;
        y = lm.y + Math.sin(angle) * lmRadius;
      }
    }

    // 3. World Perimeter Boundary Clamp
    x = Math.max(45, Math.min(WORLD_BOUNDS.width - 45, x));
    y = Math.max(45, Math.min(WORLD_BOUNDS.height - 45, y));

    return { x, y };
  }

  public update(dt: number, viewportW: number, viewportH: number) {
    this.time += dt;

    // ==========================================
    // 1. SEAMLESS CAMERA REVEAL JOURNEY
    // ==========================================
    if (this.isRevealing) {
      this.revealTimer += dt;
      const p = Math.min(1, this.revealTimer / this.revealDuration);

      // Smooth cubic ease-in-out
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      this.revealProgress = ease;

      const baseZoom = this.calculateBaseZoom(viewportW, viewportH);
      const targetCamX = WORLD_BOUNDS.width / 2;
      const targetCamY = WORLD_BOUNDS.height / 2;

      // Camera smoothly zooms out from Mandap to the full world
      this.cameraFocus.x = WORLD_BOUNDS.centerMandap.x + (targetCamX - WORLD_BOUNDS.centerMandap.x) * ease;
      this.cameraFocus.y = WORLD_BOUNDS.centerMandap.y + (targetCamY - WORLD_BOUNDS.centerMandap.y) * ease;
      this.cameraZoom = 2.3 + (baseZoom - 2.3) * ease;

      // Devotee turns to face the village at 65% of reveal
      if (p > 0.65 && this.player.facing === 'up') {
        this.player.facing = 'down';
      }

      if (p >= 1.0) {
        this.isRevealing = false;
        this.isPlayable = true;
        this.cameraFocus.x = targetCamX;
        this.cameraFocus.y = targetCamY;
        this.cameraZoom = baseZoom;
        soundEngine.playTempleBell(1.4);
      }
    } else {
      // ==========================================
      // 2. ROCK-SOLID PERMANENTLY FIXED WORLD CAMERA
      // ==========================================
      // The village world & background NEVER move with the player.
      // Buildings, trees, paths, decorations, mini-game locations remain completely stationary.
      // ONLY the player walks through the world.
      const baseZoom = this.calculateBaseZoom(viewportW, viewportH);
      this.cameraZoom = baseZoom;
      this.cameraFocus.x = WORLD_BOUNDS.width / 2;
      this.cameraFocus.y = WORLD_BOUNDS.height / 2;

      // Keep player avatar clearly discernible and playable across all viewport scales
      const minScreenPlayerSize = 22;
      this.player.size = Math.round(Math.max(26, Math.min(42, minScreenPlayerSize / this.cameraZoom)));
    }

    // ==========================================
    // 3. RESPONSIVE PLAYER MOVEMENT PHYSICS
    // ==========================================
    if (this.isPlayable) {
      if (this.hasDirectionInput) {
        // Active keyboard / joystick input
        const targetVx = this.inputDir.dx * this.player.speed;
        const targetVy = this.inputDir.dy * this.player.speed;

        // Snappy responsive acceleration
        this.playerVx += (targetVx - this.playerVx) * Math.min(1, dt * 18);
        this.playerVy += (targetVy - this.playerVy) * Math.min(1, dt * 18);

        const currentSpeed = Math.hypot(this.playerVx, this.playerVy);
        if (currentSpeed > 8) {
          const resolved = this.resolveCollisions(
            this.player.x + this.playerVx * dt,
            this.player.y + this.playerVy * dt
          );
          this.player.x = resolved.x;
          this.player.y = resolved.y;
          this.player.targetX = this.player.x;
          this.player.targetY = this.player.y;

          this.player.isMoving = true;
          this.player.stepCycle += dt * (currentSpeed / this.player.speed);

          // Update facing direction
          if (Math.abs(this.inputDir.dx) > Math.abs(this.inputDir.dy)) {
            this.player.facing = this.inputDir.dx > 0 ? 'right' : 'left';
          } else {
            this.player.facing = this.inputDir.dy > 0 ? 'down' : 'up';
          }
        } else {
          this.player.isMoving = false;
        }
      } else {
        // Point-and-click / tap target movement
        const distX = this.player.targetX - this.player.x;
        const distY = this.player.targetY - this.player.y;
        const dist = Math.hypot(distX, distY);

        if (dist > 6) {
          const step = Math.min(dist, this.player.speed * dt);
          const nextX = this.player.x + (distX / dist) * step;
          const nextY = this.player.y + (distY / dist) * step;
          const resolved = this.resolveCollisions(nextX, nextY);

          this.player.x = resolved.x;
          this.player.y = resolved.y;
          this.player.isMoving = true;
          this.player.stepCycle += dt;

          if (Math.abs(distX) > Math.abs(distY)) {
            this.player.facing = distX > 0 ? 'right' : 'left';
          } else {
            this.player.facing = distY > 0 ? 'down' : 'up';
          }
        } else {
          // Stopped naturally
          this.playerVx = 0;
          this.playerVy = 0;
          this.player.isMoving = false;
        }
      }
    }

    // ==========================================
    // 4. STORY LANDMARK PROXIMITY CHECK
    // ==========================================
    let nearestLandmark: WorldLandmark | null = null;
    let minDist = Infinity;
    for (const lm of WORLD_LANDMARKS) {
      const d = Math.hypot(this.player.x - lm.x, this.player.y - lm.y);
      if (d < lm.radius * 1.35 && d < minDist) {
        minDist = d;
        nearestLandmark = lm;
      }
    }

    if (nearestLandmark !== this.activePromptLandmark) {
      if (nearestLandmark && this.isPlayable) {
        soundEngine.playTempleBell(1.35);
      }
      this.activePromptLandmark = nearestLandmark;
    }

    // Update floating ambience particles
    this.particles.forEach(p => {
      p.x += p.vx + Math.sin(this.time * 2 + p.y * 0.01) * 0.25;
      p.y += p.vy;
      if (p.y > WORLD_BOUNDS.height) {
        p.y = 0;
        p.x = Math.random() * WORLD_BOUNDS.width;
      }
    });

    // Update screen-space petals
    this.screenPetals.forEach(p => {
      p.x += p.vx + Math.sin(this.time * 2 + p.y * 0.02) * 0.35;
      p.y += p.vy;
      p.rot += p.vrot;
      if (p.y > viewportH + 20) {
        p.y = -20;
        p.x = Math.random() * viewportW;
      }
      if (p.x < -20) p.x = viewportW + 20;
      if (p.x > viewportW + 20) p.x = -20;
    });

    this.lightMotes.forEach(m => {
      m.x += m.vx + Math.cos(this.time + m.y * 0.03) * 0.2;
      m.y += m.vy;
      if (m.y < -10) {
        m.y = viewportH + 10;
        m.x = Math.random() * viewportW;
      }
    });
  }

  public interact() {
    if (!this.isPlayable) return;
    if (this.activePromptLandmark) {
      soundEngine.playEnterChapter();
      this.onEnterChapter(this.activePromptLandmark.id);
    }
  }

  public render(ctx: CanvasRenderingContext2D, viewportW: number, viewportH: number) {
    // ==========================================
    // 1. WORLD-SPACE RENDERING (Stable Camera View)
    // ==========================================
    ctx.save();
    ctx.translate(viewportW / 2, viewportH / 2);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraFocus.x, -this.cameraFocus.y);

    // Complete Ganesha Festival Village: Sandstone floor, stone flagstone paths,
    // cottages, sacred trees, Deepasthambha lamp towers, and boundary walls
    GameRenderer.drawFestivalVillage(ctx, WORLD_BOUNDS.width, WORLD_BOUNDS.height, this.time);

    // Authentic Physical Festival Slogans & Banners in the village
    GameRenderer.drawFestivalDecorationsAndSlogans(ctx, WORLD_BOUNDS.width, WORLD_BOUNDS.height, this.time);

    // Central Sacred Mandap with Lord Ganesha's darshan (Rock-solid, stationary)
    GameRenderer.drawCentralMandap(
      ctx,
      WORLD_BOUNDS.centerMandap.x,
      WORLD_BOUNDS.centerMandap.y,
      this.time
    );

    // Flanking Brass Incense Burners near the Sanctum
    GameRenderer.drawIncenseBurner(ctx, WORLD_BOUNDS.centerMandap.x - 48, WORLD_BOUNDS.centerMandap.y + 16, this.time);
    GameRenderer.drawIncenseBurner(ctx, WORLD_BOUNDS.centerMandap.x + 48, WORLD_BOUNDS.centerMandap.y + 16, this.time + 1.2);

    // Physical Story Landmarks (firmly anchored, only ground ring glows)
    WORLD_LANDMARKS.forEach(lm => {
      const isNear = this.isPlayable && this.activePromptLandmark?.id === lm.id;
      GameRenderer.drawLandmark(ctx, lm, isNear, this.time);
    });

    // Floating Ambient Petals in World
    GameRenderer.drawParticles(ctx, this.particles);

    // Player Avatar (4-direction animated walk cycle)
    GameRenderer.drawPlayer(ctx, this.player, this.time);

    // Target indicator if moving to a point
    if (this.player.isMoving && !this.hasDirectionInput) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(this.player.targetX, this.player.targetY, 7 + Math.sin(this.time * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Divine Golden Blessing Pulse during initial entrance reveal
    if (this.isRevealing) {
      const shockRadius = this.revealProgress * WORLD_BOUNDS.width * 0.85;
      const shockAlpha = Math.max(0, 1 - this.revealProgress);

      ctx.save();
      ctx.strokeStyle = `rgba(251, 191, 36, ${shockAlpha * 0.75})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(WORLD_BOUNDS.centerMandap.x, WORLD_BOUNDS.centerMandap.y, shockRadius, 0, Math.PI * 2);
      ctx.stroke();

      const grad = ctx.createRadialGradient(
        WORLD_BOUNDS.centerMandap.x, WORLD_BOUNDS.centerMandap.y, 20,
        WORLD_BOUNDS.centerMandap.x, WORLD_BOUNDS.centerMandap.y, shockRadius
      );
      grad.addColorStop(0, `rgba(251, 191, 36, ${shockAlpha * 0.18})`);
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(WORLD_BOUNDS.centerMandap.x, WORLD_BOUNDS.centerMandap.y, shockRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // ==========================================
    // 2. SCREEN-SPACE FESTIVAL ATMOSPHERE
    // ==========================================

    // Subtle warm golden courtyard vignette
    const cx = viewportW / 2;
    const cy = viewportH / 2;
    const radius = Math.max(viewportW, viewportH) * 0.8;
    const vigGrad = ctx.createRadialGradient(cx, cy, 100, cx, cy, radius);
    vigGrad.addColorStop(0, 'rgba(251, 191, 36, 0.02)');
    vigGrad.addColorStop(0.7, 'rgba(15, 6, 2, 0.06)');
    vigGrad.addColorStop(1, 'rgba(10, 4, 1, 0.18)');

    ctx.save();
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, viewportW, viewportH);
    ctx.restore();

    // Hanging Festive Marigold Toran at the very top of the screen
    GameRenderer.drawToranGarland(ctx, viewportW, this.time);

    // Floating Screen Petals
    ctx.save();
    this.screenPetals.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Golden Light Motes (warm floating dust in sacred sanctuary)
    this.lightMotes.forEach(m => {
      ctx.fillStyle = `rgba(254, 240, 138, ${m.alpha})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
