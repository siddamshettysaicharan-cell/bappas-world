/**
 * Chapter 1: Kubera's Grand Feast
 * Complete, polished, responsive arcade game.
 * Collect delicious traditional festive foods, avoid non-food distractions,
 * build massive combos, and manage 5 chances.
 */

import { soundEngine } from '../../audio/soundEngine';
import { FallingFeastItem, FeastGameResult, FeastItemType, FloatingText, Particle } from '../../types';
import { GameStorage } from '../../utils/storage';
import { FEAST_ITEMS } from '../constants';
import { GameRenderer } from '../renderer';

export class KuberaFeastScene {
  // Game state
  public score: number = 0;
  public combo: number = 0;
  public bestCombo: number = 0;
  public chancesRemaining: number = 5;
  public maxChances: number = 5;
  public foodCollected: number = 0;
  public timeSurvived: number = 0;
  public isGameOver: boolean = false;

  // Falling objects pool
  private items: FallingFeastItem[] = [];
  private nextItemId: number = 1;
  private spawnTimer: number = 0;
  private currentSpawnInterval: number = 1.1; // seconds

  // Catching Thali (movable platter along the bottom)
  public thali = {
    x: 400,
    y: 550,
    width: 140,
    height: 38,
    vx: 0,
    targetX: 400,
  };

  // Visual effects
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private screenShake: number = 0;
  private redFlashAlpha: number = 0;
  private divineAuraAlpha: number = 0;
  private time: number = 0;

  // Ganesha Signature Reaction State
  private ganeshaReaction = {
    active: false,
    corner: 'bottom-left' as 'bottom-left' | 'bottom-right' | 'top-left',
    x: 0,
    y: 0,
    progress: 0,
    duration: 1.1,
    foodName: '',
    foodId: 'modak',
    blessingText: 'Yum! +10',
    particles: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      life: number;
      maxLife: number;
    }>,
  };
  private lastCorner: 'bottom-left' | 'bottom-right' | 'top-left' = 'top-left';

  // Callbacks
  private onGameOverCallback: (result: FeastGameResult) => void;

  constructor(onGameOver: (result: FeastGameResult) => void) {
    this.onGameOverCallback = onGameOver;
    this.reset();
  }

  public reset() {
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.chancesRemaining = 5;
    this.foodCollected = 0;
    this.timeSurvived = 0;
    this.isGameOver = false;
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawnTimer = 0.4;
    this.currentSpawnInterval = 1.1;
    this.screenShake = 0;
    this.redFlashAlpha = 0;
    this.divineAuraAlpha = 0;
    this.time = 0;
    this.ganeshaReaction.active = false;
    this.ganeshaReaction.particles = [];
  }

  // Pointer position update (mouse or touch drag for the Thali)
  public updatePointer(clientX: number, width: number) {
    this.thali.targetX = Math.max(this.thali.width / 2 + 10, Math.min(width - this.thali.width / 2 - 10, clientX));
  }

  // Move thali with keyboard arrows (left / right)
  public moveThaliKeyboard(dir: number, dt: number, width: number) {
    const moveSpeed = 650;
    this.thali.targetX = Math.max(
      this.thali.width / 2 + 10,
      Math.min(width - this.thali.width / 2 - 10, this.thali.targetX + dir * moveSpeed * dt)
    );
  }

  // Direct Click / Tap on falling items
  public handlePointerClick(clickX: number, clickY: number) {
    if (this.isGameOver) return;

    // Check collision with falling items (top to bottom of z-order)
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.collected) continue;

      const hitDist = Math.hypot(item.x - clickX, item.y - clickY);
      // Generous hit target for mobile fingers (at least 48px)
      const touchRadius = Math.max(48, item.size * 1.2);

      if (hitDist <= touchRadius) {
        this.processItemSelection(item, 'direct_tap');
        break; // handle one item per distinct tap
      }
    }
  }

  private processItemSelection(item: FallingFeastItem, _source: 'thali_catch' | 'direct_tap') {
    item.collected = true;

    if (item.type.category === 'food') {
      // SUCCESS: Correct Food Collected!
      this.combo += 1;
      if (this.combo > this.bestCombo) {
        this.bestCombo = this.combo;
      }
      this.foodCollected += 1;

      // Base 10 points + combo multiplier bonus
      const comboMultiplier = Math.min(5, Math.floor(this.combo / 4) + 1);
      const earned = 10 * comboMultiplier;
      this.score += earned;

      // Audio feedback
      soundEngine.playCollectFood(this.combo);
      if (this.combo >= 5 && this.combo % 5 === 0) {
        soundEngine.playComboStreak(this.combo);
      }

      // Floating score and combo text
      this.addFloatingText(item.x, item.y - 10, `+${earned}`, '#fde047');
      if (this.combo > 1) {
        this.addFloatingText(
          item.x,
          item.y - 32,
          this.combo >= 8 ? `INFINITE FEAST x${this.combo}!` : `COMBO x${this.combo}!`,
          this.combo >= 8 ? '#f43f5e' : '#fb923c'
        );
      }

      // Special milestone celebration banner
      if (this.combo === 5) {
        this.addFloatingText(item.x, item.y - 54, '✨ SACRED OFFERINGS x5! ✨', '#fbbf24');
      } else if (this.combo === 10) {
        this.addFloatingText(item.x, item.y - 54, '🌟 INFINITE APPETITE x10! 🌟', '#f43f5e');
      }

      // Trigger Signature Ganesha Reaction
      this.triggerGaneshaReaction(item, earned);

      // Sparkling celebration burst
      this.spawnCollectSparks(item.x, item.y, item.type.color);
      this.divineAuraAlpha = Math.min(1.0, this.divineAuraAlpha + 0.15);
    } else {
      // MISTAKE: Non-food distraction chosen
      this.combo = 0;
      this.chancesRemaining -= 1;
      this.screenShake = 14;
      this.redFlashAlpha = 0.55;

      soundEngine.playMistake();

      this.addFloatingText(item.x, item.y - 15, `NOT FOOD! -1 CHANCE`, '#ef4444');
      this.spawnMistakeParticles(item.x, item.y);

      if (this.chancesRemaining <= 0) {
        this.triggerGameOver();
      }
    }
  }

  private triggerGaneshaReaction(item: FallingFeastItem, earned: number) {
    // Select between available safe corners without immediate repetition
    const availableCorners: Array<'bottom-left' | 'bottom-right' | 'top-left'> = [
      'bottom-left',
      'bottom-right',
      'top-left',
    ];
    const choices = availableCorners.filter(c => c !== this.lastCorner);
    const corner = choices[Math.floor(Math.random() * choices.length)] || 'bottom-left';
    this.lastCorner = corner;

    // Joyful, affectionate blessing phrase
    let blessing = `+${earned} Delicious! 🍬`;
    if (item.type.id === 'modak') {
      blessing = `Sweet Modak! +${earned} 🍬`;
    } else if (item.type.id === 'ladoo') {
      blessing = `Golden Ladoo! +${earned} ✨`;
    } else if (item.type.id === 'mango') {
      blessing = `Royal Mango! +${earned} 🥭`;
    } else if (item.type.id === 'banana') {
      blessing = `Divine Offering! +${earned} 🍌`;
    } else if (item.type.id === 'payasam') {
      blessing = `Sweet Kheer! +${earned} 🥣`;
    } else if (item.type.id === 'pomegranate') {
      blessing = `Ruby Fruit! +${earned} 🍎`;
    }

    if (this.combo >= 8) {
      blessing = `Infinite Appetite! +${earned} 🕉️`;
    }

    // Spawn celebratory floating petals & golden dust particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      life: number;
      maxLife: number;
    }> = [];

    const petalColors = ['#f97316', '#facc15', '#fef08a', '#fb7185', '#34d399'];
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 70;
      particles.push({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 30,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        size: 2.5 + Math.random() * 3.5,
        alpha: 1.0,
        life: 0,
        maxLife: 0.75 + Math.random() * 0.35,
      });
    }

    this.ganeshaReaction = {
      active: true,
      corner,
      x: 0,
      y: 0,
      progress: 0.001,
      duration: 1.1,
      foodName: item.type.name,
      foodId: item.type.id,
      blessingText: blessing,
      particles,
    };

    soundEngine.playGaneshaMunch();
  }

  private triggerGameOver() {
    console.log(`[1 GAME OVER] game=kubera_feast score=${this.score}`);
    this.isGameOver = true;
    soundEngine.playGameOver();

    // Record score in local storage
    const { isNewBest, previousBest } = GameStorage.recordChapterScore('kubera_feast', this.score);

    const result: FeastGameResult = {
      chapterId: 'kubera_feast',
      score: this.score,
      foodCollected: this.foodCollected,
      bestCombo: this.bestCombo,
      timeSurvivedSeconds: Math.floor(this.timeSurvived),
      isNewBest,
      previousBest,
    };

    setTimeout(() => {
      console.log(`[2 CALLBACK] game=kubera_feast result=`, result);
      this.onGameOverCallback(result);
    }, 900);
  }

  public update(dt: number, width: number, height: number) {
    this.time += dt;

    if (this.isGameOver) {
      // Update lingering particles
      this.updateParticlesAndText(dt);
      return;
    }

    this.timeSurvived += dt;

    // Smooth difficulty calculation
    // Progressive speed scaling: starts at 2.4, gently accelerates up to 7.0
    const difficultyFactor = Math.min(1.0, this.timeSurvived / 120);
    const fallSpeedBase = 150 + difficultyFactor * 220 + Math.min(100, this.score * 0.1);

    // Spawn interval decreases smoothly from 1.15s to 0.52s
    this.currentSpawnInterval = Math.max(0.48, 1.15 - difficultyFactor * 0.55);

    // Thali smooth following with responsive lerp
    this.thali.y = height - 60;
    this.thali.x += (this.thali.targetX - this.thali.x) * Math.min(1, dt * 14);

    // Spawn falling items
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnItem(width, difficultyFactor, fallSpeedBase);
      this.spawnTimer = this.currentSpawnInterval + (Math.random() * 0.2 - 0.1);
    }

    // Update falling items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];

      if (item.collected) {
        // Shrink & fade out collected item
        item.size *= 0.88;
        item.alpha -= dt * 4;
        if (item.alpha <= 0.05 || item.size <= 2) {
          this.items.splice(i, 1);
          continue;
        }
      } else {
        item.y += item.vy * dt;
        item.x += item.vx * dt;
        item.rotation += item.rotSpeed * dt;

        // Check collision with the player's offering Thali
        const thaliLeft = this.thali.x - this.thali.width / 2;
        const thaliRight = this.thali.x + this.thali.width / 2;
        const thaliTop = this.thali.y - this.thali.height / 2;
        const thaliBottom = this.thali.y + this.thali.height / 2;

        if (
          item.x >= thaliLeft - 10 &&
          item.x <= thaliRight + 10 &&
          item.y >= thaliTop - 12 &&
          item.y <= thaliBottom + 12
        ) {
          this.processItemSelection(item, 'thali_catch');
          continue;
        }

        // Clean up items that fallen past the bottom without penalty (only selecting distractions penalizes!)
        if (item.y > height + 60) {
          // If a delicious food item fell off screen, it gently resets combo to keep the challenge lively
          if (item.type.category === 'food' && this.combo > 0) {
            this.combo = 0;
          }
          this.items.splice(i, 1);
        }
      }
    }

    // Dampen visual screen shake and flashes
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 35);
    }
    if (this.redFlashAlpha > 0) {
      this.redFlashAlpha = Math.max(0, this.redFlashAlpha - dt * 2.2);
    }
    if (this.divineAuraAlpha > 0) {
      this.divineAuraAlpha = Math.max(0, this.divineAuraAlpha - dt * 0.8);
    }

    // Update Ganesha celebratory reaction in corner
    if (this.ganeshaReaction.active) {
      this.ganeshaReaction.progress += dt / this.ganeshaReaction.duration;

      // Position correctly in the specified corner clear of falling items and Thali track
      if (this.ganeshaReaction.corner === 'bottom-left') {
        this.ganeshaReaction.x = Math.max(80, width * 0.12);
        this.ganeshaReaction.y = height - 90;
      } else if (this.ganeshaReaction.corner === 'bottom-right') {
        this.ganeshaReaction.x = Math.min(width - 80, width * 0.88);
        this.ganeshaReaction.y = height - 90;
      } else {
        // top-left (safely below HUD bar)
        this.ganeshaReaction.x = Math.max(80, width * 0.12);
        this.ganeshaReaction.y = 135;
      }

      // Update Ganesha's celebratory particles
      for (let i = this.ganeshaReaction.particles.length - 1; i >= 0; i--) {
        const pt = this.ganeshaReaction.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life += dt;
        pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        if (pt.life >= pt.maxLife) {
          this.ganeshaReaction.particles.splice(i, 1);
        }
      }

      if (this.ganeshaReaction.progress >= 1) {
        this.ganeshaReaction.active = false;
      }
    }

    this.updateParticlesAndText(dt);
  }

  private updateParticlesAndText(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 45;
      ft.life += dt;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private spawnItem(width: number, difficulty: number, speedBase: number) {
    // Determine whether to spawn a food or distraction
    // Early game: 80% food, 20% distraction.
    // Late game: 58% food, 42% distraction.
    const distractionRatio = 0.20 + difficulty * 0.22;
    const isDistraction = Math.random() < distractionRatio;

    const pool = FEAST_ITEMS.filter(it => it.category === (isDistraction ? 'distraction' : 'food'));
    const itemType = pool[Math.floor(Math.random() * pool.length)];

    const margin = 50;
    const spawnX = margin + Math.random() * (width - margin * 2);

    this.items.push({
      id: this.nextItemId++,
      type: itemType,
      x: spawnX,
      y: -40,
      vx: -15 + Math.random() * 30,
      vy: speedBase * (0.85 + Math.random() * 0.3),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: -1.8 + Math.random() * 3.6,
      size: itemType.id === 'modak' ? 32 : 30,
      collected: false,
      alpha: 1.0,
    });
  }

  private spawnCollectSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? color : '#fef08a',
        alpha: 1.0,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
  }

  private spawnMistakeParticles(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        size: 3 + Math.random() * 3,
        color: '#ef4444',
        alpha: 1.0,
        life: 0,
        maxLife: 0.45,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 0.8,
      scale: 1.0,
    });
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    // Screen Shake effect on mistake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Royal Banquet Hall Atmosphere Background (Deep Crimson, Gold & Teakwood)
    const hallGrad = ctx.createLinearGradient(0, 0, 0, height);
    hallGrad.addColorStop(0, '#2d0a06'); // royal ruby-garnet
    hallGrad.addColorStop(0.5, '#1e0804');
    hallGrad.addColorStop(1, '#0f0402');
    ctx.fillStyle = hallGrad;
    ctx.fillRect(0, 0, width, height);

    // Golden Royal Drapery & Pillars in background
    ctx.save();
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
    ctx.lineWidth = 2;
    const archW = 120;
    const archCount = Math.ceil(width / archW);
    for (let a = 0; a < archCount; a++) {
      const ax = a * archW;
      ctx.beginPath();
      ctx.arc(ax + archW / 2, 0, archW / 2, 0, Math.PI);
      ctx.stroke();
      // Royal tassel
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fillRect(ax + archW / 2 - 2, archW / 2, 4, 18);
    }
    ctx.restore();

    // Subtle festival lights / hanging chandeliers along top
    for (let l = 60; l < width; l += 140) {
      GameRenderer.drawDiya(ctx, l, 25, 11, this.time + l * 0.1);
    }

    // Golden divine aura when combos get high
    if (this.divineAuraAlpha > 0) {
      ctx.fillStyle = `rgba(251, 191, 36, ${this.divineAuraAlpha * 0.18})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Red warning vignette on mistake
    if (this.redFlashAlpha > 0) {
      ctx.fillStyle = `rgba(220, 38, 38, ${this.redFlashAlpha * 0.4})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Falling Items
    this.items.forEach(item => {
      GameRenderer.drawFeastItem(ctx, item, this.time);
    });

    // 3. Draw Player's Golden Offering Thali
    GameRenderer.drawCatchingThali(
      ctx,
      this.thali.x,
      this.thali.y,
      this.thali.width,
      this.thali.height,
      this.combo
    );

    // 4. Draw Active Particles
    GameRenderer.drawParticles(ctx, this.particles);

    // 5. Draw Signature Ganesha Reaction (Corner Celebration)
    if (this.ganeshaReaction.active) {
      GameRenderer.drawGaneshaFeastReaction(ctx, this.ganeshaReaction, this.time);
    }

    // 6. Draw Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 6. Native In-Game Game HUD (Minimal, high contrast, festive)
    this.renderHUD(ctx, width, height);

    ctx.restore();
  }

  private renderHUD(ctx: CanvasRenderingContext2D, width: number, _height: number) {
    ctx.save();

    // Top HUD Bar Container
    const isNarrow = width < 480;
    const barH = isNarrow ? 50 : 54;
    const maxHudW = Math.min(width - 24, 740);
    const hudX = (width - maxHudW) / 2;
    const hudY = 12;

    ctx.fillStyle = 'rgba(62, 48, 40, 0.90)';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, maxHudW, barH, 12);
    ctx.fill();
    ctx.stroke();

    // Distribute 4 columns evenly across available width
    const col1X = hudX + 20;
    const col2X = hudX + maxHudW * 0.28;
    const col3X = hudX + maxHudW * 0.56;
    const col4X = hudX + maxHudW - 20;

    // SCORE
    ctx.fillStyle = '#F6EBD8';
    ctx.font = isNarrow ? 'bold 10px Cinzel, serif' : 'bold 12px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', col1X, hudY + 16);
    ctx.font = isNarrow ? 'bold 18px Outfit, sans-serif' : 'bold 22px Outfit, sans-serif';
    ctx.fillStyle = '#E8C766';
    ctx.fillText(`${this.score}`, col1X, hudY + (isNarrow ? 38 : 42));

    // COMBO
    ctx.font = isNarrow ? 'bold 10px Cinzel, serif' : 'bold 12px Cinzel, serif';
    ctx.fillStyle = '#F6EBD8';
    ctx.textAlign = 'left';
    ctx.fillText('COMBO', col2X, hudY + 16);
    ctx.font = isNarrow ? 'bold 16px Outfit, sans-serif' : 'bold 20px Outfit, sans-serif';
    ctx.fillStyle = this.combo > 3 ? '#E8C766' : '#C98232';
    ctx.fillText(`x${this.combo}`, col2X, hudY + (isNarrow ? 38 : 42));

    // CHANCES (Hearts)
    ctx.font = isNarrow ? 'bold 10px Cinzel, serif' : 'bold 12px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F6EBD8';
    ctx.fillText('CHANCES', col3X, hudY + 16);

    // Render 5 Hearts
    const heartSpacing = isNarrow ? 16 : 22;
    const startHeartX = col3X - (2 * heartSpacing);
    for (let h = 0; h < this.maxChances; h++) {
      const hx = startHeartX + h * heartSpacing;
      const hy = hudY + (isNarrow ? 36 : 40);
      const isAlive = h < this.chancesRemaining;
      ctx.font = isNarrow ? '13px sans-serif' : '16px sans-serif';
      ctx.fillText(isAlive ? '❤️' : '🤍', hx, hy);
    }

    // TIME SURVIVED
    ctx.textAlign = 'right';
    ctx.font = isNarrow ? 'bold 10px Cinzel, serif' : 'bold 12px Cinzel, serif';
    ctx.fillStyle = '#F6EBD8';
    ctx.fillText('TIME', col4X, hudY + 16);

    const mins = Math.floor(this.timeSurvived / 60);
    const secs = Math.floor(this.timeSurvived % 60);
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    ctx.font = isNarrow ? 'bold 16px monospace' : 'bold 20px monospace';
    ctx.fillStyle = '#F6EBD8';
    ctx.fillText(timeStr, col4X, hudY + (isNarrow ? 38 : 42));

    ctx.restore();
  }
}
