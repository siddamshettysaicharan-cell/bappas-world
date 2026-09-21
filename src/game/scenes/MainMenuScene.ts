/**
 * Main Menu Title Scene for Ganesha — Stories of Wisdom
 * Features rich Indian festival atmosphere, floating marigold petals,
 * glowing oil lamps, and interactive title elements.
 */

import { soundEngine } from '../../audio/soundEngine';
import { Particle } from '../../types';
import { GameRenderer } from '../renderer';

export class MainMenuScene {
  private petals: Particle[] = [];
  private time: number = 0;
  private onStartGame: () => void;
  private onOpenLore: () => void;

  constructor(onStartGame: () => void, onOpenLore: () => void) {
    this.onStartGame = onStartGame;
    this.onOpenLore = onOpenLore;
    this.initPetals();
  }

  private initPetals() {
    this.petals = [];
    for (let i = 0; i < 35; i++) {
      this.petals.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: -0.5 + Math.random() * 1.0,
        vy: 0.8 + Math.random() * 1.2,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.4 ? '#f97316' : '#fbbf24', // Marigold orange & saffron
        alpha: 0.4 + Math.random() * 0.5,
        life: 0,
        maxLife: 100,
      });
    }
  }

  public update(dt: number, width: number, height: number) {
    this.time += dt;

    // Update floating petals
    this.petals.forEach(p => {
      p.x += p.vx + Math.sin(this.time * 2 + p.y * 0.01) * 0.4;
      p.y += p.vy;
      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
    });
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Deep festive night background with warm golden radial illumination
    const bgGrad = ctx.createRadialGradient(width / 2, height * 0.45, 40, width / 2, height * 0.5, Math.max(width, height) * 0.75);
    bgGrad.addColorStop(0, '#381608');
    bgGrad.addColorStop(0.4, '#240d04');
    bgGrad.addColorStop(0.8, '#140702');
    bgGrad.addColorStop(1, '#0a0402');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative festival Rangoli backdrop
    ctx.save();
    ctx.globalAlpha = 0.22;
    GameRenderer.drawRangoli(ctx, width / 2, height * 0.42, Math.min(width, height) * 0.38, this.time * 0.3);
    ctx.restore();

    // Floating festive marigold petals
    GameRenderer.drawParticles(ctx, this.petals);

    // Flanking warm oil lamps (Diyas) on bottom borders
    const diyaCount = Math.floor(width / 90);
    for (let d = 0; d <= diyaCount; d++) {
      const dx = (d * width) / Math.max(1, diyaCount);
      GameRenderer.drawDiya(ctx, dx, height - 28, 14, this.time + d * 0.8);
    }

    // Top Hanging Toran Garland (marigold blossoms)
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    const garlands = Math.ceil(width / 120);
    for (let g = 0; g < garlands; g++) {
      const startX = g * 120;
      const endX = (g + 1) * 120;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.quadraticCurveTo((startX + endX) / 2, 28, endX, 0);
      ctx.stroke();

      // Flowers on garland
      for (let f = 0; f < 5; f++) {
        const fa = (f + 1) / 6;
        const fx = startX + (endX - startX) * fa;
        const fy = Math.sin(fa * Math.PI) * 26;
        ctx.fillStyle = f % 2 === 0 ? '#f97316' : '#eab308';
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Central Divine Motif: Stylized Golden Modak & Om emblem
    const emblemY = Math.max(80, height * 0.24);
    GameRenderer.drawModakVector(ctx, width / 2, emblemY, 34);

    // Gentle floating aura around title
    const glowPulse = 1 + Math.sin(this.time * 3) * 0.08;
    const titleGlow = ctx.createRadialGradient(width / 2, height * 0.4, 20, width / 2, height * 0.4, 220 * glowPulse);
    titleGlow.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
    titleGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = titleGlow;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.4, 220 * glowPulse, 0, Math.PI * 2);
    ctx.fill();

    // Game Title
    ctx.save();
    ctx.textAlign = 'center';

    // Subtitle top banner
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('✨ A SACRED GANESH CHATURTHI JOURNEY ✨', width / 2, height * 0.35);

    // Main Title "GANESHA"
    const titleFontSize = Math.min(68, width * 0.11);
    ctx.font = `900 ${titleFontSize}px Cinzel, serif`;
    ctx.fillStyle = '#1c0a02'; // shadow
    ctx.fillText('GANESHA', width / 2 + 2, height * 0.44 + 3);

    // Golden gradient fill for title
    const textGrad = ctx.createLinearGradient(0, height * 0.38, 0, height * 0.46);
    textGrad.addColorStop(0, '#fffbeb');
    textGrad.addColorStop(0.4, '#fef08a');
    textGrad.addColorStop(0.7, '#f59e0b');
    textGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = textGrad;
    ctx.fillText('GANESHA', width / 2, height * 0.44);

    // "STORIES OF WISDOM"
    const subFontSize = Math.min(24, width * 0.045);
    ctx.font = `700 ${subFontSize}px Cinzel, serif`;
    ctx.fillStyle = '#fed7aa';
    ctx.letterSpacing = '6px';
    ctx.fillText('STORIES OF WISDOM', width / 2, height * 0.51);

    // Decorative divider line with diamond
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, height * 0.55);
    ctx.lineTo(width / 2 + 120, height * 0.55);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.55, 4, 0, Math.PI * 2);
    ctx.fill();

    // Narrative tag
    ctx.font = '500 14px Outfit, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.letterSpacing = '1px';
    ctx.fillText('Explore the sacred world & play divine story chapters', width / 2, height * 0.60);

    ctx.restore();
  }

  public handlePlayClick() {
    soundEngine.playTempleBell(1.0);
    soundEngine.startAmbient();
    this.onStartGame();
  }

  public handleLoreClick() {
    soundEngine.playClick();
    this.onOpenLore();
  }
}
