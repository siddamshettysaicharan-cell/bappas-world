/**
 * Cinematic Intro Scene for Ganesha — Stories of Wisdom
 * 
 * A completely separate, full-screen opening cinematic scene dedicated solely to Lord Ganesha.
 * Features an initial peaceful ~2-second Vinayaka darshan, followed by an interactive scroll/swipe-based
 * camera journey with multi-layered parallax, dynamic festive illumination, and a seamless
 * camera reveal into the playable Ganesha festival world.
 */

import { soundEngine } from '../../audio/soundEngine';
import { GameRenderer } from '../renderer';

interface FloatingPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  color: string;
  depth: number; // For parallax and blur
}

interface GoldenMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  pulsePhase: number;
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  growth: number;
}

export class CinematicIntroScene {
  // Interaction & Scroll Progress
  public scrollProgress: number = 0; // Current smoothed progress (0.0 to 1.0)
  private targetScrollProgress: number = 0; // Target progress driven by wheel/touch
  private initialTimer: number = 0; // Initial seconds for peaceful darshan
  private time: number = 0; // Total elapsed time for procedural animation

  // State Machine
  public isCompleted: boolean = false;
  private isTransitioningToWorld: boolean = false;
  private transitionTimer: number = 0;
  private readonly transitionDuration: number = 1.4; // 1.4s camera transition

  // Audio Flags
  private hasStartedAudio: boolean = false;
  private hasPlayedPeakChime: boolean = false;

  // Touch tracking for mobile swipe
  private touchStartY: number | null = null;
  private lastTouchY: number | null = null;

  // Visual Atmosphere Collections
  private petals: FloatingPetal[] = [];
  private motes: GoldenMote[] = [];
  private smoke: SmokeParticle[] = [];

  // Callback when intro completes and playable world takes over
  private onComplete: () => void;

  constructor(onComplete: () => void) {
    this.onComplete = onComplete;
    this.initAtmosphere();
  }

  private initAtmosphere() {
    // Floating festive flower petals (Marigold orange, saffron gold, rose pink)
    const colors = ['#ea580c', '#f59e0b', '#facc15', '#e11d48', '#fb7185'];
    for (let i = 0; i < 36; i++) {
      this.petals.push({
        x: Math.random() * 1200,
        y: Math.random() * 900,
        vx: -0.4 + Math.random() * 0.8,
        vy: 0.6 + Math.random() * 1.4,
        rot: Math.random() * Math.PI * 2,
        vrot: -0.02 + Math.random() * 0.04,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        depth: 0.5 + Math.random() * 1.5,
      });
    }

    // Golden divine light motes
    for (let i = 0; i < 45; i++) {
      this.motes.push({
        x: Math.random() * 1200,
        y: Math.random() * 900,
        vx: -0.25 + Math.random() * 0.5,
        vy: -0.3 - Math.random() * 0.5,
        alpha: 0.2 + Math.random() * 0.7,
        size: 1.5 + Math.random() * 3.5,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Incense smoke puffs from flanking brass burners
    for (let i = 0; i < 20; i++) {
      this.smoke.push({
        x: Math.random() > 0.5 ? 400 + Math.random() * 40 : 800 + Math.random() * 40,
        y: 600 - Math.random() * 250,
        vx: -0.2 + Math.random() * 0.4,
        vy: -0.7 - Math.random() * 0.6,
        alpha: 0.05 + Math.random() * 0.18,
        size: 15 + Math.random() * 35,
        growth: 0.3 + Math.random() * 0.5,
      });
    }
  }

  /**
   * Handle desktop wheel & trackpad scrolling
   */
  public handleWheel(deltaY: number) {
    if (this.isTransitioningToWorld || this.isCompleted) return;
    this.ensureAudioStarted();

    // Map scroll down to progress increase with smooth, reliable sensitivity
    const sensitivity = 0.0022;
    this.targetScrollProgress = Math.max(0, Math.min(1.02, this.targetScrollProgress + deltaY * sensitivity));
  }

  /**
   * Handle mobile touch start
   */
  public handleTouchStart(clientY: number) {
    if (this.isTransitioningToWorld || this.isCompleted) return;
    this.ensureAudioStarted();
    this.touchStartY = clientY;
    this.lastTouchY = clientY;
  }

  /**
   * Handle mobile touch swipe
   */
  public handleTouchMove(clientY: number) {
    if (this.isTransitioningToWorld || this.isCompleted) return;
    if (this.lastTouchY === null) {
      this.lastTouchY = clientY;
      return;
    }

    // Both swipe up and down advance smoothly
    const rawDelta = this.lastTouchY - clientY;
    const deltaY = Math.abs(rawDelta) > 1 ? Math.max(rawDelta, Math.abs(rawDelta) * 0.75) : 0;
    this.lastTouchY = clientY;

    const touchSensitivity = 0.005;
    this.targetScrollProgress = Math.max(0, Math.min(1.02, this.targetScrollProgress + deltaY * touchSensitivity));
  }

  /**
   * Handle touch release
   */
  public handleTouchEnd() {
    this.touchStartY = null;
    this.lastTouchY = null;
  }

  /**
   * Handle screen tap/click to smoothly advance darshan
   */
  public handlePointerTap() {
    if (this.isTransitioningToWorld || this.isCompleted) return;
    this.ensureAudioStarted();
    this.targetScrollProgress = Math.min(1.02, this.targetScrollProgress + 0.35);
  }

  public ensureAudioStarted() {
    if (!this.hasStartedAudio) {
      this.hasStartedAudio = true;
      soundEngine.startAmbient();
    }
  }

  /**
   * Fast entry trigger to smoothly transition into the world
   */
  public triggerEnterWorld() {
    if (this.isCompleted) return;
    this.ensureAudioStarted();
    this.isCompleted = true;
    this.isTransitioningToWorld = true;
    this.onComplete();
  }

  /**
   * Update intro animation loop
   */
  public update(dt: number, viewportW: number, viewportH: number) {
    if (!viewportW || !viewportH) return;
    this.time += dt;
    this.initialTimer += dt;

    // Smooth lerp scrolling progress with spring response
    const lerpSpeed = dt * 8;
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * Math.min(1, lerpSpeed);

    // Check peak close-up reached (scrollProgress > 0.92)
    if (this.scrollProgress >= 0.92 && !this.hasPlayedPeakChime) {
      this.hasPlayedPeakChime = true;
      soundEngine.playTempleBell(1.0);
    }

    // Trigger seamless camera transition into world when player reaches darshan
    if (this.scrollProgress >= 0.95 && !this.isCompleted) {
      this.isCompleted = true;
      this.isTransitioningToWorld = true;
      this.onComplete();
      return;
    }

    // Update floating petals
    this.petals.forEach(p => {
      p.x += p.vx + Math.sin(this.time * 2 + p.y * 0.02) * (0.5 * p.depth);
      p.y += p.vy * p.depth;
      p.rot += p.vrot;
      if (p.y > viewportH + 20) {
        p.y = -20;
        p.x = Math.random() * viewportW;
      }
      if (p.x < -20) p.x = viewportW + 20;
      if (p.x > viewportW + 20) p.x = -20;
    });

    // Update golden motes
    this.motes.forEach(m => {
      m.x += m.vx + Math.cos(this.time + m.y * 0.03) * 0.3;
      m.y += m.vy;
      if (m.y < -10) {
        m.y = viewportH + 10;
        m.x = Math.random() * viewportW;
      }
    });

    // Update incense smoke
    this.smoke.forEach(s => {
      s.x += s.vx + Math.sin(this.time * 1.5 + s.y * 0.03) * 0.4;
      s.y += s.vy;
      s.size += s.growth * dt * 8;
      s.alpha -= dt * 0.04;
      if (s.alpha <= 0 || s.y < 100) {
        s.y = 560 + Math.random() * 40;
        s.x = Math.random() > 0.5 ? viewportW * 0.35 + Math.random() * 30 : viewportW * 0.65 + Math.random() * 30;
        s.alpha = 0.12 + Math.random() * 0.14;
        s.size = 15 + Math.random() * 20;
      }
    });
  }

  /**
   * Render the cinematic intro scene
   */
  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const cx = width / 2;
    const cy = height / 2;

    // Normalised scroll progression clamped 0 to 1
    const p = Math.min(1, Math.max(0, this.scrollProgress));

    // Transition factor when camera pulls back into playable world
    let pullBackFactor = 0;
    if (this.isTransitioningToWorld) {
      const t = Math.min(1, this.transitionTimer / this.transitionDuration);
      // Smooth cubic ease-in-out
      pullBackFactor = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Dynamic Camera Zoom & Position
    // As player scrolls down:
    // Scale starts at base (approx 1.25), smoothly expands up to close-up peak (2.2)
    // Then on pullback, eases back down to 1.0 (matching the game world)
    const baseScale = Math.min(1.4, Math.max(1.15, (height / 600) * 1.2));
    const peakScale = baseScale * 1.85;
    const scrollScale = baseScale + (peakScale - baseScale) * p;
    const finalScale = scrollScale + (1.0 - scrollScale) * pullBackFactor;

    // Camera center offset
    // During scroll: tilts slightly downward as we move forward into the mandap
    const camOffsetY = -25 * p * (1 - pullBackFactor) + 60 * pullBackFactor;

    // =========================================================================
    // LAYER 1: DEEP SANCTUM BACKGROUND & RADIANT AURA (PARALLAX 0.2x)
    // =========================================================================
    // Soft, dark, respectful atmosphere that gradually brightens with festive warmth
    const bgParallax = p * 15;
    const ambientLightLevel = 0.25 + 0.5 * p; // Increases with scroll

    // Deep sacred gradient background
    const bgGrad = ctx.createRadialGradient(cx, cy + camOffsetY * 0.2, 50, cx, cy + camOffsetY * 0.2, Math.max(width, height) * 0.9);
    bgGrad.addColorStop(0, `rgba(45, 18, 7, ${0.9 + 0.1 * p})`);
    bgGrad.addColorStop(0.4, `rgba(26, 10, 4, ${0.95})`);
    bgGrad.addColorStop(0.85, '#0d0401');
    bgGrad.addColorStop(1, '#050100');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Warm Golden Divine Backglow behind Vinayaka
    const divineBackGlow = ctx.createRadialGradient(cx, cy - 20 + camOffsetY * 0.3, 20, cx, cy - 20 + camOffsetY * 0.3, 260 * finalScale);
    divineBackGlow.addColorStop(0, `rgba(254, 240, 138, ${0.45 * ambientLightLevel})`);
    divineBackGlow.addColorStop(0.35, `rgba(251, 191, 36, ${0.35 * ambientLightLevel})`);
    divineBackGlow.addColorStop(0.7, `rgba(217, 119, 6, ${0.18 * ambientLightLevel})`);
    divineBackGlow.addColorStop(1, 'rgba(217, 119, 6, 0)');

    ctx.fillStyle = divineBackGlow;
    ctx.beginPath();
    ctx.arc(cx, cy - 20 + camOffsetY * 0.3, 260 * finalScale, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Temple Arch Silhouettes in Deep Background
    ctx.save();
    ctx.strokeStyle = `rgba(180, 83, 9, ${0.12 + 0.18 * p})`;
    ctx.lineWidth = 3;
    const archRadius = Math.min(width, height) * 0.42 * (1 + p * 0.15);
    ctx.beginPath();
    ctx.arc(cx, cy + 60 + bgParallax, archRadius, Math.PI, 0, false);
    ctx.stroke();
    // Inner concentric arch
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 60 + bgParallax, archRadius * 0.92, Math.PI, 0, false);
    ctx.stroke();
    ctx.restore();

    // =========================================================================
    // LAYER 2: FESTIVAL MANDAP PILLARS & GARLANDS (PARALLAX 0.5x)
    // =========================================================================
    // Surrounding decorated Mandap elements slowly become visible as player scrolls
    const mandapAlpha = Math.min(1, 0.35 + p * 0.65);
    const pillarSpread = (width * 0.38) * (1 + p * 0.25); // Pillars frame the sanctum and expand outwards

    ctx.save();
    ctx.globalAlpha = mandapAlpha;
    const leftPillarX = cx - pillarSpread;
    const rightPillarX = cx + pillarSpread;
    const pillarTopY = cy - 260 + camOffsetY * 0.5;
    const pillarBottomY = cy + 240 + camOffsetY * 0.5;

    // Draw Left & Right Ornate Temple Pillars
    this.drawFestivePillar(ctx, leftPillarX, pillarTopY, pillarBottomY, this.time);
    this.drawFestivePillar(ctx, rightPillarX, pillarTopY, pillarBottomY, this.time + 1.5);

    // Mandap Hanging Toran & Marigold Garlands between Pillars
    this.drawMandapArchGarland(ctx, leftPillarX, rightPillarX, pillarTopY + 20, p, this.time);

    // Flanking Brass Deepam Floor Lamps
    const lampAlpha = Math.min(1, 0.4 + p * 0.6);
    ctx.globalAlpha = lampAlpha;
    this.drawBrassDeepamStand(ctx, cx - pillarSpread * 0.65, cy + 130 + camOffsetY * 0.6, 1.0 + p * 0.2, this.time);
    this.drawBrassDeepamStand(ctx, cx + pillarSpread * 0.65, cy + 130 + camOffsetY * 0.6, 1.0 + p * 0.2, this.time + 1.8);
    ctx.restore();

    // =========================================================================
    // LAYER 3: MANDAP FLOOR & RADIATING RANGOLI
    // =========================================================================
    const floorY = cy + 90 + camOffsetY * 0.8;
    ctx.save();
    // Sacred Rangoli Kolam underneath Lotus Peetha
    const rangoliRadius = 140 * finalScale;
    const rangoliAlpha = Math.min(0.8, 0.25 + p * 0.55);
    ctx.globalAlpha = rangoliAlpha;

    // Radial Rangoli petals
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI * 2) / 16 + this.time * 0.02;
      const rx = cx + Math.cos(ang) * (rangoliRadius * 0.7);
      const ry = floorY + Math.sin(ang) * (rangoliRadius * 0.28);
      ctx.beginPath();
      ctx.ellipse(rx, ry, 12 * finalScale, 6 * finalScale, ang, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Outer concentric Rangoli rings
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, floorY, rangoliRadius, rangoliRadius * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, floorY, rangoliRadius * 0.85, rangoliRadius * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // =========================================================================
    // LAYER 4: THE CENTRAL REVERED VINAYAKA (CENTERPIECE, PARALLAX 1.0x)
    // =========================================================================
    // Lord Ganesha: Majestically centered, peaceful, divine, and commanding
    const ganeshaY = cy - 25 + camOffsetY;
    GameRenderer.drawDetailedVinayaka(ctx, cx, ganeshaY, this.time, finalScale);

    // Auspicious Pooja Offering Thali in front of Lord Ganesha
    const thaliY = ganeshaY + 54 * finalScale;
    this.drawPoojaOffering(ctx, cx, thaliY, finalScale, this.time);

    // =========================================================================
    // LAYER 5: INCENSE SMOKE & FLANKING DHOOP BURNERS
    // =========================================================================
    // Brass Dhoop Burners curling aromatic incense smoke
    const burnerOffsetX = 90 * finalScale;
    GameRenderer.drawIncenseBurner(ctx, cx - burnerOffsetX, thaliY - 6 * finalScale, this.time);
    GameRenderer.drawIncenseBurner(ctx, cx + burnerOffsetX, thaliY - 6 * finalScale, this.time + 1.2);

    // Rising translucent incense smoke puffs
    ctx.save();
    this.smoke.forEach(s => {
      const smokeGrad = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, s.size);
      smokeGrad.addColorStop(0, `rgba(254, 243, 199, ${s.alpha * 1.2})`);
      smokeGrad.addColorStop(0.5, `rgba(217, 119, 6, ${s.alpha * 0.5})`);
      smokeGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');

      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // =========================================================================
    // LAYER 6: FOREGROUND FESTIVAL PARTICLES & PETALS (PARALLAX 1.6x)
    // =========================================================================
    // Golden sparkling motes
    ctx.save();
    this.motes.forEach(m => {
      const pulse = 0.7 + Math.sin(this.time * 3 + m.pulsePhase) * 0.3;
      ctx.fillStyle = `rgba(254, 240, 138, ${m.alpha * pulse})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size * (1 + p * 0.3), 0, Math.PI * 2);
      ctx.fill();
    });

    // Floating marigold, rose, and saffron petals with rotation
    this.petals.forEach(pt => {
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rot);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, pt.size * pt.depth, pt.size * pt.depth * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden petal highlight
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-pt.size * 0.6, 0);
      ctx.lineTo(pt.size * 0.6, 0);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

    // =========================================================================
    // LAYER 7: FESTIVE TORAN OVERLAY AT TOP OF SCREEN
    // =========================================================================
    GameRenderer.drawToranGarland(ctx, width, this.time);

    // =========================================================================
    // LAYER 8: DYNAMIC VIGNETTE & CINEMATIC ATMOSPHERE
    // =========================================================================
    // Initial: Soft, slightly dark edges keeping Vinayaka as the clear focus
    // Scroll progress: Expands outward, brightening into rich festival light
    const vigRadius = Math.max(width, height) * (0.65 + p * 0.35);
    const vigOpacity = Math.max(0.08, 0.65 * (1 - p * 0.7) * (1 - pullBackFactor));

    const vig = ctx.createRadialGradient(cx, cy, 60, cx, cy, vigRadius);
    vig.addColorStop(0, 'rgba(251, 191, 36, 0.02)');
    vig.addColorStop(0.5, `rgba(180, 83, 9, ${vigOpacity * 0.3})`);
    vig.addColorStop(0.85, `rgba(15, 6, 2, ${vigOpacity * 0.85})`);
    vig.addColorStop(1, `rgba(8, 3, 1, ${vigOpacity * 1.1})`);

    ctx.save();
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // =========================================================================
    // LAYER 9: WHISPER-QUIET SCROLL CUE (Only after 2.0s if user hasn't scrolled)
    // =========================================================================
    if (this.initialTimer >= 2.0 && p < 0.08 && !this.isTransitioningToWorld) {
      const cueAlpha = Math.min(0.85, (this.initialTimer - 2.0) / 1.2) * (1 - p / 0.08);
      ctx.save();
      ctx.globalAlpha = cueAlpha;

      const cueY = height - 55;
      const bob = Math.sin(this.time * 3.5) * 4;

      // Soft glow pill behind hint
      ctx.fillStyle = 'rgba(15, 6, 2, 0.65)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.lineWidth = 1;
      const pillW = 190;
      const pillH = 34;
      ctx.beginPath();
      ctx.roundRect(cx - pillW / 2, cueY - pillH / 2 + bob, pillW, pillH, 17);
      ctx.fill();
      ctx.stroke();

      // Delicate downward arrow
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(cx, cueY + 7 + bob);
      ctx.lineTo(cx - 5, cueY + 1 + bob);
      ctx.lineTo(cx + 5, cueY + 1 + bob);
      ctx.closePath();
      ctx.fill();

      // Whisper-quiet text
      const isMobile = width < 768;
      ctx.font = '600 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fde68a';
      ctx.fillText(isMobile ? 'SWIPE UP TO ENTER' : 'SCROLL TO ENTER DARSHAN', cx, cueY - 4 + bob);

      ctx.restore();
    }
  }

  /**
   * Helper: Draw an ornate festival Mandap pillar
   */
  private drawFestivePillar(ctx: CanvasRenderingContext2D, x: number, topY: number, bottomY: number, time: number) {
    const width = 28;
    const height = bottomY - topY;

    ctx.save();
    // Pillar Shafty
    const grad = ctx.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
    grad.addColorStop(0, '#92400e');
    grad.addColorStop(0.3, '#d97706');
    grad.addColorStop(0.7, '#f59e0b');
    grad.addColorStop(1, '#78350f');

    ctx.fillStyle = grad;
    ctx.fillRect(x - width / 2, topY, width, height);

    // Carved Capital (top)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x - width, topY);
    ctx.lineTo(x + width, topY);
    ctx.lineTo(x + width / 2, topY + 18);
    ctx.lineTo(x - width / 2, topY + 18);
    ctx.closePath();
    ctx.fill();

    // Carved Base (bottom)
    ctx.beginPath();
    ctx.moveTo(x - width / 2, bottomY - 18);
    ctx.lineTo(x + width / 2, bottomY - 18);
    ctx.lineTo(x + width, bottomY);
    ctx.lineTo(x - width, bottomY);
    ctx.closePath();
    ctx.fill();

    // Spiral Marigold Garland wrapping down the pillar
    const wraps = 8;
    for (let w = 0; w < wraps; w++) {
      const wy = topY + 24 + (w * (height - 48)) / wraps;
      ctx.fillStyle = w % 2 === 0 ? '#ea580c' : '#facc15';
      ctx.beginPath();
      ctx.ellipse(x, wy, width * 0.65, 5, 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hanging Brass Bell on pillar arm
    const bellY = topY + 32;
    const bellSway = Math.sin(time * 2 + x * 0.01) * 2;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, topY + 18);
    ctx.lineTo(x + bellSway, bellY);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + bellSway, bellY + 6, 6, Math.PI, 0, true);
    ctx.lineTo(x + bellSway - 7, bellY + 13);
    ctx.lineTo(x + bellSway + 7, bellY + 13);
    ctx.closePath();
    ctx.fill();

    // Red silk bell tassel
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + bellSway, bellY + 13);
    ctx.lineTo(x + bellSway, bellY + 22);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Helper: Draw an arching marigold garland between the Mandap pillars
   */
  private drawMandapArchGarland(ctx: CanvasRenderingContext2D, leftX: number, rightX: number, y: number, progress: number, time: number) {
    const midX = (leftX + rightX) / 2;
    const sag = 45 + Math.sin(time * 1.5) * 3;

    ctx.save();
    // Heavy orange marigold swag
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.quadraticCurveTo(midX, y + sag, rightX, y);
    ctx.stroke();

    // Saffron golden inner swag
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.quadraticCurveTo(midX, y + sag - 4, rightX, y);
    ctx.stroke();

    // Central Auspicious Mango Leaf Toran Pendant
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(midX - 10, y + sag);
    ctx.quadraticCurveTo(midX, y + sag + 26, midX, y + sag + 30);
    ctx.quadraticCurveTo(midX, y + sag + 26, midX + 10, y + sag);
    ctx.closePath();
    ctx.fill();

    // Golden tassel bead
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(midX, y + sag + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Helper: Draw tall standing brass temple lamp (Kuthuvilakku)
   */
  private drawBrassDeepamStand(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Circular multi-tiered brass base
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, -3, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slender central column with brass rings
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2.5, -50, 5, 47);

    // Decorative ring nodes
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -25, 5, 0, Math.PI * 2);
    ctx.fill();

    // Oil cup dish (Agel)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, -50, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, -52, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flickering Golden Flame
    const flicker = 1 + Math.sin(time * 12 + x) * 0.15;
    const flameH = 14 * flicker;

    // Ambient radial glow
    const flameGlow = ctx.createRadialGradient(0, -56, 2, 0, -56, 32);
    flameGlow.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
    flameGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.25)');
    flameGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = flameGlow;
    ctx.beginPath();
    ctx.arc(0, -56, 32, 0, Math.PI * 2);
    ctx.fill();

    // Inner Flame
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-4, -54);
    ctx.quadraticCurveTo(0, -54 - flameH * 1.2, 0, -54 - flameH);
    ctx.quadraticCurveTo(0, -54 - flameH * 1.2, 4, -54);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-2, -54);
    ctx.quadraticCurveTo(0, -54 - flameH * 0.8, 0, -54 - flameH * 0.7);
    ctx.quadraticCurveTo(0, -54 - flameH * 0.8, 2, -54);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Helper: Auspicious pooja offering thali before Lord Vinayaka
   */
  private drawPoojaOffering(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Brass Thali Plate
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, -1, 33, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Fresh Coconut with fibers
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-14, -6, 7, 0, Math.PI * 2);
    ctx.fill();

    // Vermilion Tilak on coconut
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-14, -7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Durva Grass blades (green auspicious grass)
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(-2, -12, 2, -14);
    ctx.moveTo(-2, -2);
    ctx.quadraticCurveTo(3, -11, 6, -13);
    ctx.moveTo(1, -2);
    ctx.quadraticCurveTo(7, -10, 10, -11);
    ctx.stroke();

    // Sweet Golden Modaks piled on plate
    const modakPositions = [
      { dx: 12, dy: -4 },
      { dx: 18, dy: -3 },
      { dx: 15, dy: -8 },
    ];
    modakPositions.forEach(m => {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(m.dx - 4, m.dy + 3);
      ctx.quadraticCurveTo(m.dx, m.dy - 6, m.dx, m.dy - 7);
      ctx.quadraticCurveTo(m.dx, m.dy - 6, m.dx + 4, m.dy + 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // Small brass Pancha Deepam Diya in center of thali
    GameRenderer.drawDiya(ctx, 0, -4, 8, time);

    ctx.restore();
  }
}
