/**
 * High-performance 2D Canvas Vector Rendering System
 * Draws beautiful Indian festival aesthetics: Mandap, Ganesha darshan,
 * rangoli, diyas, flower garlands, food items, and avatars.
 */

import { FallingFeastItem, Particle, PlayerAvatar, WorldLandmark } from '../types';

export class GameRenderer {
  /**
   * Draw glowing Diya (oil lamp) with dynamic flame
   */
  public static drawDiya(ctx: CanvasRenderingContext2D, x: number, y: number, size = 16, time = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Warm radial glow on floor
    const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 2.8);
    glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
    glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, size * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Clay lamp base
    ctx.fillStyle = '#9a3412'; // terracotta
    ctx.beginPath();
    ctx.ellipse(0, size * 0.3, size, size * 0.5, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lamp lip rim
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.3, size, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Oil pool
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.3, size * 0.75, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flickering flame
    const flicker = Math.sin(time * 8 + x * 0.1) * (size * 0.1);
    const flameH = size * 1.3 + Math.cos(time * 6 + y) * (size * 0.15);

    // Flame outer (orange-red)
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-size * 0.35, size * 0.2);
    ctx.quadraticCurveTo(-size * 0.4, -flameH * 0.4, 0 + flicker, -flameH);
    ctx.quadraticCurveTo(size * 0.4, -flameH * 0.4, size * 0.35, size * 0.2);
    ctx.closePath();
    ctx.fill();

    // Flame core (bright yellow-white)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 0.2);
    ctx.quadraticCurveTo(-size * 0.2, -flameH * 0.3, 0 + flicker * 0.6, -flameH * 0.75);
    ctx.quadraticCurveTo(size * 0.2, -flameH * 0.3, size * 0.2, size * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw an intricate Rangoli pattern on the floor
   */
  public static drawRangoli(ctx: CanvasRenderingContext2D, x: number, y: number, radius = 90, time = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Soft outer ring
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Concentric dotted circle
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 8 Petals
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const angle = (i * Math.PI * 2) / petals;
      ctx.save();
      ctx.rotate(angle);

      // Saffron outer petal
      ctx.fillStyle = 'rgba(234, 88, 12, 0.55)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(radius * 0.3, radius * 0.45, 0, radius * 0.8);
      ctx.quadraticCurveTo(-radius * 0.3, radius * 0.45, 0, 0);
      ctx.fill();

      // Yellow inner motif
      ctx.fillStyle = 'rgba(250, 204, 21, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, radius * 0.15);
      ctx.quadraticCurveTo(radius * 0.18, radius * 0.4, 0, radius * 0.6);
      ctx.quadraticCurveTo(-radius * 0.18, radius * 0.4, 0, radius * 0.15);
      ctx.fill();

      // White fine border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    // Inner bright center lotus
    ctx.fillStyle = 'rgba(244, 63, 94, 0.75)'; // Rose pink center
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw the Central Sacred Mandap with reverent Ganesha Presence
   */
  public static drawCentralMandap(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    ctx.save();
    ctx.translate(x, y);

    // Warm sacred radiance / aura
    const mandapGlow = ctx.createRadialGradient(0, 0, 40, 0, 0, 240);
    mandapGlow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    mandapGlow.addColorStop(0.35, 'rgba(245, 158, 11, 0.22)');
    mandapGlow.addColorStop(0.7, 'rgba(180, 83, 9, 0.08)');
    mandapGlow.addColorStop(1, 'rgba(18, 10, 6, 0)');
    ctx.fillStyle = mandapGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 240, 0, Math.PI * 2);
    ctx.fill();

    // 1. Soft 2.5D Ground Shadow under Mandap Base
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 25, 150, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Large Traditional Rice & Turmeric Floor Rangoli around the sanctum
    GameRenderer.drawRangoli(ctx, 0, 0, 155, time);

    // 3. Stepped 2.5D Sandstone Plinth (3 Tiers with depth and bevels)
    const plinthTiers = [
      { r: 138, h: 8, col: '#24120a', stroke: '#78350f' },
      { r: 124, h: 7, col: '#2d160c', stroke: '#92400e' },
      { r: 110, h: 6, col: '#361b0f', stroke: '#b45309' },
    ];
    plinthTiers.forEach((tier, idx) => {
      const sides = 8;
      // Step 3D skirt / depth
      ctx.fillStyle = '#1c0c06';
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const px = Math.cos(a) * tier.r;
        const py = Math.sin(a) * (tier.r * 0.55) + idx * 4;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Top step surface
      ctx.fillStyle = tier.col;
      ctx.strokeStyle = tier.stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const px = Math.cos(a) * tier.r;
        const py = Math.sin(a) * (tier.r * 0.52) + idx * 3 - 3;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 4. Flanking Brass Urli Bowls with floating water & fresh flowers
    const urliPositions = [{ x: -138, y: 8 }, { x: 138, y: 8 }];
    urliPositions.forEach((u, ui) => {
      // Urli shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + 10, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Brass rim
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(u.x, u.y, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Water
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(u.x, u.y, 13, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Floating yellow marigold & red hibiscus petals
      const flowerSway = Math.sin(time * 1.5 + ui) * 1.5;
      ctx.fillStyle = '#f59e0b'; // Marigold
      ctx.beginPath();
      ctx.arc(u.x - 4 + flowerSway, u.y - 1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626'; // Hibiscus
      ctx.beginPath();
      ctx.arc(u.x + 4 - flowerSway, u.y + 1, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Ornate Carved Pillars of the Mandap (2.5D perspective)
    const pillarPositions = [
      { x: -105, y: -78 },
      { x: 105, y: -78 },
      { x: -105, y: 68 },
      { x: 105, y: 68 },
    ];
    pillarPositions.forEach((p, pi) => {
      // Pillar base shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 16, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Brass stepped plinth base
      ctx.fillStyle = '#78350f';
      ctx.fillRect(p.x - 12, p.y + 4, 24, 10);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(p.x - 10, p.y - 2, 20, 7);

      // Carved Teakwood & Golden Pillar Shaft
      const grad = ctx.createLinearGradient(p.x - 10, p.y, p.x + 10, p.y);
      grad.addColorStop(0, '#78350f');
      grad.addColorStop(0.35, '#d97706');
      grad.addColorStop(0.65, '#fef08a');
      grad.addColorStop(1, '#92400e');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x - 9, p.y - 58, 18, 58);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - 9, p.y - 58, 18, 58);

      // Carved capital bracket at top
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(p.x - 14, p.y - 58);
      ctx.lineTo(p.x + 14, p.y - 58);
      ctx.lineTo(p.x + 9, p.y - 48);
      ctx.lineTo(p.x - 9, p.y - 48);
      ctx.closePath();
      ctx.fill();

      // Fresh Marigold Flower Garland wrapped around pillar
      ctx.fillStyle = '#ea580c';
      for (let f = 0; f < 5; f++) {
        ctx.beginPath();
        ctx.arc(p.x, p.y - 42 + f * 9.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hanging Brass Temple Bell (Ghanta) with gentle sway
      const bellSway = Math.sin(time * 2.2 + pi * 1.5) * 2;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 48);
      ctx.lineTo(p.x + bellSway * 0.4, p.y - 32);
      ctx.stroke();

      // Bell body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(p.x + bellSway, p.y - 27, 5, Math.PI, 0);
      ctx.lineTo(p.x + bellSway + 6, p.y - 21);
      ctx.lineTo(p.x + bellSway - 6, p.y - 21);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bell clapper
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(p.x + bellSway * 1.2, p.y - 19, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Ornate Arch Toran connecting top pillars with fresh mango leaves
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-105, -70);
    ctx.quadraticCurveTo(0, -48, 105, -70);
    ctx.stroke();

    // Mango leaves & marigold blooms along arch
    for (let m = -80; m <= 80; m += 20) {
      const archY = -70 + (1 - Math.pow(m / 105, 2)) * 22;
      // Leaf
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(m, archY + 5, 4, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Marigold bloom
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(m, archY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Sacred Toran Signboard: “श्री गणेशाय नमः” (Carved Teakwood & Gold)
    ctx.save();
    const signW = 190;
    const signH = 26;
    const signY = -92;

    // Board shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-signW / 2 + 3, signY + 3, signW, signH, 6);
    ctx.fill();

    // Dark Teakwood Sign Base
    ctx.fillStyle = '#261208';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-signW / 2, signY, signW, signH, 6);
    ctx.fill();
    ctx.stroke();

    // Golden inner decorative border
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-signW / 2 + 3, signY + 3, signW - 6, signH - 6);

    // Sacred Devanagari text
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px "Yatra One", "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText('॥ श्री गणेशाय नमः ॥', 0, signY + signH / 2);
    ctx.restore();

    // 8. PROMINENT, REVERENT, BEAUTIFUL LORD GANESHA DARSHAN
    // Scaled up to 1.65x with gentle divine breathing and soft shadow
    GameRenderer.drawDetailedVinayaka(ctx, 0, 5, time, 1.65);

    // 9. Four Corner Brass Deepams around Mandap
    GameRenderer.drawDiya(ctx, -118, -100, 16, time);
    GameRenderer.drawDiya(ctx, 118, -100, 16, time + 1);
    GameRenderer.drawDiya(ctx, -118, 88, 16, time + 2);
    GameRenderer.drawDiya(ctx, 118, 88, 16, time + 3);

    ctx.restore();
  }

  /**
   * Draw Lord Vinayaka in majestic, devotional, respectful vector grandeur
   */
  public static drawDetailedVinayaka(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    if (scale !== 1.0) {
      ctx.scale(scale, scale);
    }

    // 1. Divine Nimbus / Prabhavali (Golden radiant halo with sacred flame finial)
    const haloPulse = 1 + Math.sin(time * 2.5) * 0.04;
    const haloRadius = 40 * haloPulse;

    // Ambient radial glow behind head
    const prabhaGlow = ctx.createRadialGradient(0, -32, 10, 0, -32, haloRadius * 1.5);
    prabhaGlow.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
    prabhaGlow.addColorStop(0.4, 'rgba(251, 191, 36, 0.35)');
    prabhaGlow.addColorStop(0.8, 'rgba(217, 119, 6, 0.15)');
    prabhaGlow.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = prabhaGlow;
    ctx.beginPath();
    ctx.arc(0, -32, haloRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Golden Halo Outer Rim
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -32, haloRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Concentric inner beaded ring
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(0, -32, haloRadius * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Radiating Sacred Sunbeams (16 rays)
    const rays = 16;
    for (let r = 0; r < rays; r++) {
      const ra = (r * Math.PI * 2) / rays + time * 0.08;
      const rInner = haloRadius * 1.02;
      const rOuter = haloRadius * (r % 2 === 0 ? 1.25 : 1.15);
      ctx.strokeStyle = r % 2 === 0 ? '#fef08a' : '#f59e0b';
      ctx.lineWidth = r % 2 === 0 ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ra) * rInner, -32 + Math.sin(ra) * rInner);
      ctx.lineTo(Math.cos(ra) * rOuter, -32 + Math.sin(ra) * rOuter);
      ctx.stroke();
    }

    // 2. Sacred Double Lotus Throne (Peetha)
    // Outer blooming rose petals
    ctx.fillStyle = '#e11d48';
    for (let l = 0; l < 9; l++) {
      const ang = Math.PI * 0.12 + (l * Math.PI * 0.76) / 8;
      const lx = Math.cos(ang) * 54;
      const ly = Math.sin(ang) * 28 + 14;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 16, 10, ang - Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Inner vibrant pink lotus petals with gold tips
    ctx.fillStyle = '#f43f5e';
    for (let l = 0; l < 9; l++) {
      const ang = Math.PI * 0.15 + (l * Math.PI * 0.7) / 8;
      const lx = Math.cos(ang) * 46;
      const ly = Math.sin(ang) * 24 + 13;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 13, 8, ang - Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Lotus center golden stamen pad
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 16, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Divine Body & Pitambara Silk Robes (Saffron & Vermillion)
    // Seated legs (Padmasana)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 14, 34, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Royal Saffron Silk Dhoti with golden embroidered borders
    const dhotiGrad = ctx.createLinearGradient(0, -5, 0, 22);
    dhotiGrad.addColorStop(0, '#ea580c');
    dhotiGrad.addColorStop(0.7, '#c2410c');
    dhotiGrad.addColorStop(1, '#9a3412');
    ctx.fillStyle = dhotiGrad;
    ctx.beginPath();
    ctx.ellipse(0, 12, 32, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold Zari Border on Dhoti
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 14, 30, 15, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Golden Kamarbandh (waist sash with jeweled buckle)
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, 4);
    ctx.quadraticCurveTo(0, 8, 18, 4);
    ctx.stroke();
    ctx.fillStyle = '#ef4444'; // Central Ruby Gem
    ctx.beginPath();
    ctx.arc(0, 6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Noble rounded Divine Torso
    const torsoGrad = ctx.createRadialGradient(0, -6, 5, 0, -6, 26);
    torsoGrad.addColorStop(0, '#fef08a');
    torsoGrad.addColorStop(0.5, '#f59e0b');
    torsoGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.ellipse(0, -6, 26, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Janeu (Sacred Thread) crossing diagonally from left shoulder
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -18);
    ctx.quadraticCurveTo(-4, 0, 14, 10);
    ctx.stroke();

    // 4. Four Divine Arms with Sacred Symbols
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Upper Right Arm: Raising the Sacred Ankusha (Elephant Goad of Wisdom)
    ctx.beginPath();
    ctx.moveTo(16, -12);
    ctx.lineTo(32, -22);
    ctx.stroke();
    // Golden Ankusha vector
    ctx.save();
    ctx.translate(32, -22);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -10);
    ctx.quadraticCurveTo(8, -10, 8, -4);
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Upper Left Arm: Holding Sacred Pasha (Golden Noose of Detachment)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.lineTo(-32, -22);
    ctx.stroke();
    // Golden Pasha Loop
    ctx.save();
    ctx.translate(-32, -22);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -6, 6, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Lower Right Arm: Abhaya Mudra (Gesture of Divine Blessing & Fearlessness)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(30, -6);
    ctx.stroke();
    // Open blessing palm with auspicious red lotus mark
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(32, -8, 6, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ef4444'; // Red auspicious lotus circle on blessing palm
    ctx.beginPath();
    ctx.arc(32, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Lower Left Arm: Holding Modakapatra (Golden Bowl of Modaks)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-28, 4);
    ctx.stroke();
    // Golden Bowl
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(-30, 4, 10, 6, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Sweet Modaks in bowl
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-33, 2, 3.5, 0, Math.PI * 2);
    ctx.arc(-29, 0, 4, 0, Math.PI * 2);
    ctx.arc(-26, 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Divine Head, Benevolent Ears, and Single Sacred Tusk
    // Noble Elephant Head
    const headGrad = ctx.createRadialGradient(0, -26, 4, 0, -26, 22);
    headGrad.addColorStop(0, '#fef08a');
    headGrad.addColorStop(0.55, '#f59e0b');
    headGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, -26, 21, 0, Math.PI * 2);
    ctx.fill();

    // Large benevolent Ears
    // Left Ear
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(-22, -26, 14, 18, -Math.PI / 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner ear soft blush
    ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-22, -26, 9, 13, -Math.PI / 10, 0, Math.PI * 2);
    ctx.fill();
    // Golden Kundala (Earring)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-30, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-30, -14, 2, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(22, -26, 14, 18, Math.PI / 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner ear soft blush
    ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
    ctx.beginPath();
    ctx.ellipse(22, -26, 9, 13, Math.PI / 10, 0, Math.PI * 2);
    ctx.fill();
    // Golden Kundala (Earring)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(30, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(30, -14, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Ekadanta (Right Whole Ivory Tusk)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -17);
    ctx.quadraticCurveTo(14, -13, 17, -8);
    ctx.quadraticCurveTo(12, -10, 7, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Broken Left Tusk (Divine Scribe of Mahabharata symbol)
    ctx.fillStyle = '#fdf4ff';
    ctx.beginPath();
    ctx.moveTo(-8, -17);
    ctx.lineTo(-12, -13);
    ctx.lineTo(-7, -14);
    ctx.closePath();
    ctx.fill();

    // Curved Trunk (Vakratunda) gracefully reaching towards the modak bowl
    ctx.strokeStyle = headGrad;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(-6, -4, -16, -1);
    ctx.quadraticCurveTo(-24, -2, -21, -8);
    ctx.stroke();

    // Golden Ring Bands on Trunk
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-3, -10);
    ctx.moveTo(-11, -6);
    ctx.lineTo(-9, -4);
    ctx.stroke();

    // Golden Modak tasted at the tip of the trunk
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-21, -8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Benevolent Lotus-Petal Shaped Eyes
    ctx.fillStyle = '#451a03';
    // Left eye
    ctx.beginPath();
    ctx.ellipse(-9, -27, 3, 2, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-9.8, -27.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(9, -27, 3, 2, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8.2, -27.5, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Forehead: Chandan Tripundra & Radiant Kumkum / Sindoor Tilak
    // White sandalwood Tripundra lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, -35);
    ctx.lineTo(6, -35);
    ctx.moveTo(-5, -37.5);
    ctx.lineTo(5, -37.5);
    ctx.moveTo(-4, -40);
    ctx.lineTo(4, -40);
    ctx.stroke();

    // Red Vermillion (Kumkum / Sindoor) Tilak with golden bindi
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(0, -36, 2.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -32.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Magnificent Ornate Crown (Kiritamukuta)
    const crownGrad = ctx.createLinearGradient(0, -42, 0, -70);
    crownGrad.addColorStop(0, '#f59e0b');
    crownGrad.addColorStop(0.5, '#fbbf24');
    crownGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = crownGrad;

    // Multi-tiered crown structure
    ctx.beginPath();
    ctx.moveTo(-16, -42);
    ctx.lineTo(-13, -56);
    ctx.lineTo(-8, -62);
    ctx.lineTo(0, -70);
    ctx.lineTo(8, -62);
    ctx.lineTo(13, -56);
    ctx.lineTo(16, -42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Crown jewel bands
    ctx.fillStyle = '#ef4444'; // Central Ruby
    ctx.beginPath();
    ctx.arc(0, -50, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981'; // Emerald accents
    ctx.beginPath();
    ctx.arc(-7, -46, 2.5, 0, Math.PI * 2);
    ctx.arc(7, -46, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Crown finial tip jewel
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -70, 3, 0, Math.PI * 2);
    ctx.fill();

    // 7. Auspicious Floral Vanamala (Garland)
    // Marigold orange and yellow blossoms draped around the shoulders
    const garlandPoints = [
      { x: -18, y: -16, c: '#f97316' },
      { x: -22, y: -8, c: '#facc15' },
      { x: -20, y: 0, c: '#f97316' },
      { x: -14, y: 6, c: '#ef4444' }, // Red hibiscus
      { x: -6, y: 10, c: '#facc15' },
      { x: 0, y: 12, c: '#f97316' },
      { x: 6, y: 10, c: '#facc15' },
      { x: 14, y: 6, c: '#ef4444' }, // Red hibiscus
      { x: 20, y: 0, c: '#f97316' },
      { x: 22, y: -8, c: '#facc15' },
      { x: 18, y: -16, c: '#f97316' },
    ];
    garlandPoints.forEach(p => {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 8. Front Offerings: Brass Pooja Thali with Modaks & Lit Deepam
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 24, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Modak mounds on thali
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-8, 22, 4, 0, Math.PI * 2);
    ctx.arc(0, 20, 4.5, 0, Math.PI * 2);
    ctx.arc(8, 22, 4, 0, Math.PI * 2);
    ctx.fill();

    // Small sacred green Durva grass blades on thali
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, 22);
    ctx.lineTo(14, 18);
    ctx.moveTo(11, 23);
    ctx.lineTo(16, 21);
    ctx.stroke();

    // Central brass Diya burning in front of the throne
    GameRenderer.drawDiya(ctx, 0, 28, 11, time);

    ctx.restore();
  }

  /**
   * Draw Hanging Festive Marigold Toran / Garlands along top
   */
  public static drawToranGarland(ctx: CanvasRenderingContext2D, width: number, time = 0) {
    ctx.save();
    const garlandCount = Math.max(3, Math.ceil(width / 120));
    const span = width / garlandCount;

    for (let g = 0; g < garlandCount; g++) {
      const x1 = g * span;
      const x2 = (g + 1) * span;
      const midX = (x1 + x2) / 2;
      const dropY = 42 + Math.sin(time + g) * 2;

      // Curve string
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.quadraticCurveTo(midX, dropY, x2, 0);
      ctx.stroke();

      // Flower blossoms along the arc
      const flowers = 7;
      for (let f = 0; f <= flowers; f++) {
        const t = f / flowers;
        // quadratic curve point
        const fx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
        const fy = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * dropY + t * t * 0;

        // Alternating Mango Leaf
        if (f % 2 === 1) {
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.ellipse(fx, fy + 8, 4, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Marigold Blossom (Saffron Orange & Yellow)
        ctx.fillStyle = f % 2 === 0 ? '#ea580c' : '#facc15';
        ctx.beginPath();
        ctx.arc(fx, fy, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Draw natural curling incense smoke (Agarbatti / Dhoop)
   */
  public static drawIncenseBurner(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    ctx.save();
    ctx.translate(x, y);

    // Brass Dhoop Holder
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-6, -8, 12, 8);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.strokeRect(-6, -8, 12, 8);

    // Burning glowing red ember
    const emberPulse = 0.7 + Math.sin(time * 5) * 0.3;
    ctx.fillStyle = `rgba(239, 68, 68, ${emberPulse})`;
    ctx.beginPath();
    ctx.arc(0, -9, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Natural curling wisps of fragrant smoke
    const smokeNodes = 12;
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.18)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -9);

    for (let i = 1; i <= smokeNodes; i++) {
      const nodeY = -9 - i * 7;
      const wave = Math.sin(time * 2.5 + i * 0.6) * (i * 2.2);
      ctx.lineTo(wave, nodeY);
    }
    ctx.stroke();

    // Secondary subtle trail
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.1)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    for (let i = 1; i <= smokeNodes; i++) {
      const nodeY = -9 - i * 6.5;
      const wave = Math.cos(time * 2 + i * 0.5) * (i * 1.8);
      ctx.lineTo(wave, nodeY);
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw an interactive World Landmark Pavilion (Stationary, stable, architectural)
   */
  public static drawLandmark(
    ctx: CanvasRenderingContext2D,
    landmark: WorldLandmark,
    isNear: boolean,
    time: number
  ) {
    ctx.save();
    ctx.translate(landmark.x, landmark.y);

    // 1. Soft 2.5D Ground Shadow under entire landmark pavilion
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 14, landmark.radius * 0.85, landmark.radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Floor base circular courtyard (solid ground, NO shaking)
    const baseGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, landmark.radius);
    baseGrad.addColorStop(0, 'rgba(42, 22, 12, 0.9)');
    baseGrad.addColorStop(0.7, 'rgba(28, 14, 8, 0.75)');
    baseGrad.addColorStop(1, 'rgba(18, 9, 5, 0)');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, landmark.radius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Interactive Golden Proximity Ground Ring (soft luminous aura on ground)
    if (isNear) {
      const ringPulse = Math.sin(time * 3) * 0.15 + 0.85;
      ctx.save();
      ctx.strokeStyle = `rgba(251, 191, 36, ${ringPulse * 0.9})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, landmark.radius * 1.05, time * 1.2, time * 1.2 + Math.PI * 2);
      ctx.stroke();

      // Soft ground glow
      const glowGrad = ctx.createRadialGradient(0, 0, landmark.radius * 0.4, 0, 0, landmark.radius * 1.15);
      glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
      glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, landmark.radius * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Mini decorative Rangoli pattern on shrine floor
    GameRenderer.drawRangoli(ctx, 0, 0, landmark.radius * 0.68, time);

    // 5. Pavilion Shrine Plinth / Base (Carved Sandstone with 2.5D bevel)
    ctx.fillStyle = '#221008';
    ctx.beginPath();
    ctx.ellipse(0, 6, landmark.radius * 0.58, landmark.radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#361a0e';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, landmark.radius * 0.56, landmark.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 6. Landmark Theme-Specific Vector Artwork (Architecturally anchored)
    switch (landmark.id) {
      case 'kubera_feast': {
        // Royal Golden Thali overflowing with Modaks & Sweets
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(0, 7, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(0, 4, 26, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Modaks heap
        GameRenderer.drawModakVector(ctx, 0, -8, 15);
        GameRenderer.drawModakVector(ctx, -12, -2, 11);
        GameRenderer.drawModakVector(ctx, 12, -2, 11);
        // Small clay sweet pot
        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.arc(-20, 2, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'unstoppable_scribe': {
        // Ancient Palm Leaf Manuscript Scroll (Grantha) & Sacred Ivory Stylus
        ctx.fillStyle = '#fef3c7'; // parchment
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-22, -14, 44, 26, 4);
        ctx.fill();
        ctx.stroke();

        // Sanskrit script lines
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        for (let l = -8; l <= 6; l += 5) {
          ctx.beginPath();
          ctx.moveTo(-15, l);
          ctx.lineTo(15, l);
          ctx.stroke();
        }

        // Golden Stylus / Quill with divine ivory tip
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(12, -20);
        ctx.lineTo(-4, 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Brass inkpot
        ctx.fillStyle = '#78350f';
        ctx.fillRect(14, -4, 8, 9);
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(18, -4, 4, Math.PI, 0);
        ctx.fill();
        break;
      }
      case 'great_race': {
        // Sacred Flowing River Currents & Lotus Stepping Pad
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Top river wave
        ctx.moveTo(-22, -10);
        ctx.bezierCurveTo(-10, -17, 10, -3, 22, -10);
        ctx.stroke();
        // Bottom river wave
        ctx.beginPath();
        ctx.moveTo(-22, 10);
        ctx.bezierCurveTo(-10, 3, 10, 17, 22, 10);
        ctx.stroke();

        // Emerald Lotus Floating Pad (Deep natural green)
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Sacred Golden Modak atop the pad
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.quadraticCurveTo(5, 0, 4, 4);
        ctx.quadraticCurveTo(0, 6, -4, 4);
        ctx.quadraticCurveTo(-5, 0, 0, -6);
        ctx.fill();
        break;
      }
      case 'the_gatekeeper': {
        // Ornate Temple Archway & Sacred Trishul of Shiva in warm gold/sandstone
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -6, 18, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-18, -6);
        ctx.lineTo(-18, 14);
        ctx.moveTo(18, -6);
        ctx.lineTo(18, 14);
        ctx.stroke();

        // Sacred Trishul in center (Gold)
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(0, -14);
        ctx.moveTo(-7, -8);
        ctx.quadraticCurveTo(-7, -13, 0, -10);
        ctx.moveTo(7, -8);
        ctx.quadraticCurveTo(7, -13, 0, -10);
        ctx.stroke();

        // Small brass temple bell hanging in the arch
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -14, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'mushaks_adventure': {
        // Friendly Mushak Vahana silhouette with offering plate
        ctx.fillStyle = '#78716c'; // silver-grey mouse coat
        ctx.beginPath();
        ctx.ellipse(0, 4, 15, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.beginPath();
        ctx.moveTo(11, 2);
        ctx.lineTo(21, 5);
        ctx.lineTo(11, 8);
        ctx.closePath();
        ctx.fill();
        // Ears
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(5, -4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        // Little modak
        GameRenderer.drawModakVector(ctx, 21, 2, 8);
        break;
      }
    }

    // 7. Flanking Brass Diyas (steady bases, realistic flickering flame)
    GameRenderer.drawDiya(ctx, -landmark.radius * 0.62, 0, 11, time);
    GameRenderer.drawDiya(ctx, landmark.radius * 0.62, 0, 11, time + 1.5);

    // 8. Carved Stone Plaque Name Label (Integrated into world, not a huge UI card)
    ctx.save();
    const lblW = 138;
    const lblH = 24;
    const lblY = landmark.radius * 0.64;

    // Plaque shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-lblW / 2 + 2, lblY + 2, lblW, lblH, 6);
    ctx.fill();

    // Plaque stone base
    ctx.fillStyle = isNear ? '#2a1408' : '#1c0c05';
    ctx.strokeStyle = isNear ? '#f59e0b' : '#78350f';
    ctx.lineWidth = isNear ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.roundRect(-lblW / 2, lblY, lblW, lblH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isNear ? '#fef08a' : '#fed7aa';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${landmark.icon} ${landmark.bannerText}`, 0, lblY + lblH / 2);
    ctx.restore();

    ctx.restore();
  }

  /**
   * Draw Player Avatar with 4-way direction, fluid step animation, and devotional clothing
   */
  public static drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerAvatar, time: number) {
    ctx.save();
    ctx.translate(player.x, player.y);

    const size = player.size;
    const isMoving = player.isMoving;
    const facing = player.facing || 'down';

    // Step animation calculations
    const stepSpeed = 10;
    const stepSwing = isMoving ? Math.sin(player.stepCycle * stepSpeed) : 0;
    const stepLift = isMoving ? Math.abs(Math.cos(player.stepCycle * stepSpeed)) * 3 : 0;
    const bob = isMoving ? Math.sin(player.stepCycle * stepSpeed * 2) * 2 : Math.sin(time * 2.5) * 1.2;

    // 1. Soft Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.75, size * 0.55, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Animated Feet / Sandals
    const footColor = '#92400e'; // traditional leather sandals
    ctx.fillStyle = footColor;

    if (facing === 'down' || facing === 'up') {
      // Left and right feet stepping
      const leftY = size * 0.65 + (isMoving ? stepSwing * 4 : 0);
      const rightY = size * 0.65 - (isMoving ? stepSwing * 4 : 0);
      ctx.beginPath();
      ctx.ellipse(-size * 0.22, leftY, 4, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(size * 0.22, rightY, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Side view feet
      const frontX = facing === 'right' ? size * 0.15 + stepSwing * 5 : -size * 0.15 + stepSwing * 5;
      const backX = facing === 'right' ? -size * 0.15 - stepSwing * 5 : size * 0.15 - stepSwing * 5;
      ctx.beginPath();
      ctx.ellipse(frontX, size * 0.68, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(backX, size * 0.68, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Dhoti / Lower Garment (Festive cream/white with golden border)
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(-size * 0.32, size * 0.2 + bob, size * 0.64, size * 0.45, [2, 2, 6, 6]);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Saffron Kurta / Upper Body
    ctx.fillStyle = '#ea580c'; // rich festive saffron
    ctx.beginPath();
    ctx.roundRect(-size * 0.36, -size * 0.35 + bob, size * 0.72, size * 0.65, 6);
    ctx.fill();
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Golden Uttariya / Festive Scarf
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (facing === 'right') {
      ctx.moveTo(-size * 0.2, -size * 0.25 + bob);
      ctx.quadraticCurveTo(size * 0.1, 0 + bob, size * 0.35, size * 0.35 + bob);
    } else if (facing === 'left') {
      ctx.moveTo(size * 0.2, -size * 0.25 + bob);
      ctx.quadraticCurveTo(-size * 0.1, 0 + bob, -size * 0.35, size * 0.35 + bob);
    } else {
      // Crossing chest/back
      ctx.moveTo(-size * 0.3, -size * 0.25 + bob);
      ctx.quadraticCurveTo(0, size * 0.05 + bob, size * 0.32, size * 0.38 + bob);
    }
    ctx.stroke();

    // 6. Head, Hair & Facial Details according to direction
    const headY = -size * 0.58 + bob;
    ctx.fillStyle = '#fed7aa'; // warm skin tone
    ctx.beginPath();
    ctx.arc(0, headY, size * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Traditional Topknot / Shikha Hair
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, headY - size * 0.24, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    if (facing === 'down') {
      // Hair framing forehead
      ctx.beginPath();
      ctx.arc(0, headY - size * 0.12, size * 0.24, Math.PI, 0);
      ctx.fill();

      // Sandalwood & Kumkum Tilak
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(0, headY - size * 0.05, 1.8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, headY - size * 0.01, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Eyes & Serene Expression
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(-size * 0.1, headY + size * 0.04, 1.3, 0, Math.PI * 2);
      ctx.arc(size * 0.1, headY + size * 0.04, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Carrying Brass Pooja Offering Thali in front
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, size * 0.05 + bob, size * 0.28, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Modak & Marigold offering on thali
      GameRenderer.drawModakVector(ctx, 0, size * 0.03 + bob, 8);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-size * 0.12, size * 0.04 + bob, 3, 0, Math.PI * 2);
      ctx.arc(size * 0.12, size * 0.04 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (facing === 'up') {
      // Back of head - full dark hair
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, headY - size * 0.06, size * 0.27, 0, Math.PI * 2);
      ctx.fill();

      // Back of folded hands or carrying thali upward
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.05 + bob, size * 0.2, size * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (facing === 'left') {
      // Profile hair
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(size * 0.05, headY - size * 0.08, size * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Profile eye
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(-size * 0.12, headY + size * 0.02, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Profile thali held forward
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-size * 0.25, size * 0.05 + bob, size * 0.16, size * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      GameRenderer.drawModakVector(ctx, -size * 0.25, size * 0.03 + bob, 7);
    } else if (facing === 'right') {
      // Profile hair
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(-size * 0.05, headY - size * 0.08, size * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Profile eye
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(size * 0.12, headY + size * 0.02, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Profile thali held forward
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(size * 0.25, size * 0.05 + bob, size * 0.16, size * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      GameRenderer.drawModakVector(ctx, size * 0.25, size * 0.03 + bob, 7);
    }

    ctx.restore();
  }

  /**
   * Draw the complete Ganesha Festival Village Environment
   * Sandstone courtyard, ceremonial pathways, village pavilions, sacred trees,
   * Deepasthambha lamp towers, and boundary decorations.
   */
  public static drawFestivalVillage(
    ctx: CanvasRenderingContext2D,
    worldW: number,
    worldH: number,
    time: number
  ) {
    // 1. Sandstone Courtyard Tile Floor
    const tileSize = 64;
    const cols = Math.ceil(worldW / tileSize);
    const rows = Math.ceil(worldH / tileSize);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isAlt = (r + c) % 2 === 0;
        ctx.fillStyle = isAlt ? '#1e0e07' : '#170b05';
        ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

        // Subtle sandstone grout lines
        ctx.strokeStyle = '#27130a';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }

    // 2. Wide Ceremonial Paved Stone Flagstone Promenades
    const paths = [
      // Central East-West Promenade
      { x1: 180, y1: 380, x2: 1100, y2: 380, w: 72 },
      // Central North-South Promenade
      { x1: 640, y1: 140, x2: 640, y2: 690, w: 72 },
      // Diagonal paths from Mandap to four corner pavilions
      { x1: 640, y1: 380, x2: 240, y2: 190, w: 56 },
      { x1: 640, y1: 380, x2: 1040, y2: 190, w: 56 },
      { x1: 640, y1: 380, x2: 240, y2: 590, w: 56 },
      { x1: 640, y1: 380, x2: 1040, y2: 590, w: 56 },
      // Outer perimeter connector paths
      { x1: 240, y1: 190, x2: 240, y2: 590, w: 46 },
      { x1: 1040, y1: 190, x2: 1040, y2: 590, w: 46 },
      { x1: 240, y1: 590, x2: 640, y2: 655, w: 46 },
      { x1: 1040, y1: 590, x2: 640, y2: 655, w: 46 },
    ];

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Stone pathway base
    paths.forEach(p => {
      ctx.strokeStyle = '#2d160c';
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    });

    // Golden terracotta paving fill
    paths.forEach(p => {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.22)';
      ctx.lineWidth = p.w - 8;
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    });

    // Inlaid Marigold Flower Petal path margins
    paths.forEach(p => {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // 3. Circular Pradakshina Stone Ring around Central Mandap
    ctx.save();
    ctx.strokeStyle = '#2d160c';
    ctx.lineWidth = 50;
    ctx.beginPath();
    ctx.arc(640, 380, 150, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.25)';
    ctx.lineWidth = 42;
    ctx.beginPath();
    ctx.arc(640, 380, 150, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.arc(640, 380, 168, 0, Math.PI * 2);
    ctx.arc(640, 380, 132, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 4. Village Cottages / Pavilions along North Wall & Edges
    const villageHouses = [
      { x: 140, y: 70, w: 110, h: 65 },
      { x: 440, y: 65, w: 130, h: 70 },
      { x: 710, y: 65, w: 130, h: 70 },
      { x: 1010, y: 70, w: 110, h: 65 },
      { x: 80, y: 380, w: 75, h: 90 },
      { x: 1200, y: 380, w: 75, h: 90 },
    ];

    villageHouses.forEach(h => {
      // House Wall Base (Sandstone & plaster)
      ctx.fillStyle = '#26130b';
      ctx.fillRect(h.x - h.w / 2, h.y - h.h / 2, h.w, h.h);
      ctx.strokeStyle = '#3d1d10';
      ctx.lineWidth = 2;
      ctx.strokeRect(h.x - h.w / 2, h.y - h.h / 2, h.w, h.h);

      // Terracotta Sloping Tile Roof
      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.moveTo(h.x - h.w / 2 - 8, h.y - h.h / 2 + 10);
      ctx.lineTo(h.x, h.y - h.h / 2 - 18);
      ctx.lineTo(h.x + h.w / 2 + 8, h.y - h.h / 2 + 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Warm glowing festive doorway / lantern window
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(h.x, h.y + 4, 10, Math.PI, 0);
      ctx.lineTo(h.x + 10, h.y + 22);
      ctx.lineTo(h.x - 10, h.y + 22);
      ctx.closePath();
      ctx.fill();

      // Hanging Mango Leaf Toran over door
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y + 2, 11, Math.PI, 0);
      ctx.stroke();
    });

    // 5. Sacred Mango & Ashoka Trees with festive flower wraps
    const sacredTrees = [
      { x: 80, y: 220, r: 42 },
      { x: 1200, y: 220, r: 42 },
      { x: 80, y: 550, r: 40 },
      { x: 1200, y: 550, r: 40 },
      { x: 430, y: 240, r: 34 },
      { x: 850, y: 240, r: 34 },
      { x: 430, y: 560, r: 34 },
      { x: 850, y: 560, r: 34 },
    ];

    sacredTrees.forEach(t => {
      // Soft tree shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(t.x + 5, t.y + 12, t.r * 1.1, t.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#451a03';
      ctx.fillRect(t.x - 5, t.y - 10, 10, 26);

      // Marigold garland wrapped around trunk
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(t.x - 5, t.y);
      ctx.lineTo(t.x + 5, t.y + 4);
      ctx.moveTo(t.x - 5, t.y + 8);
      ctx.lineTo(t.x + 5, t.y + 12);
      ctx.stroke();

      // Lush layered foliage canopy
      ctx.fillStyle = '#14532d'; // deep forest green
      ctx.beginPath();
      ctx.arc(t.x, t.y - 18, t.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#15803d'; // bright leaf green
      ctx.beginPath();
      ctx.arc(t.x - 6, t.y - 24, t.r * 0.75, 0, Math.PI * 2);
      ctx.arc(t.x + 8, t.y - 20, t.r * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Golden blossom speckles
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(t.x - 10, t.y - 22, 2.5, 0, Math.PI * 2);
      ctx.arc(t.x + 12, t.y - 18, 2.5, 0, Math.PI * 2);
      ctx.arc(t.x + 2, t.y - 32, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Deepasthambha (Traditional Brass Temple Lamp Towers) along Promenade
    const lampTowers = [
      { x: 380, y: 380 },
      { x: 900, y: 380 },
      { x: 500, y: 200 },
      { x: 780, y: 200 },
      { x: 640, y: 540 },
    ];

    lampTowers.forEach(lt => {
      // Brass Pillar Base
      ctx.fillStyle = '#92400e';
      ctx.fillRect(lt.x - 4, lt.y - 28, 8, 30);
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(lt.x, lt.y + 2, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lamp tiers
      GameRenderer.drawDiya(ctx, lt.x - 14, lt.y - 16, 8, time);
      GameRenderer.drawDiya(ctx, lt.x + 14, lt.y - 16, 8, time + 1);
      GameRenderer.drawDiya(ctx, lt.x, lt.y - 28, 10, time + 2);
    });

    // 7. Akash Kandil (Festive Paper Lanterns) hanging between village posts - Limited elegant palette
    const kandeels = [
      { x: 320, y: 135, color: '#ea580c' }, // Muted saffron
      { x: 960, y: 135, color: '#d97706' }, // Warm amber / turmeric
      { x: 180, y: 470, color: '#b45309' }, // Terracotta
      { x: 1100, y: 470, color: '#15803d' }, // Deep forest green
    ];

    kandeels.forEach(k => {
      // Hanging wire
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(k.x, k.y - 20);
      ctx.lineTo(k.x, k.y);
      ctx.stroke();

      // Hexagonal diamond lantern
      ctx.fillStyle = k.color;
      ctx.beginPath();
      ctx.moveTo(k.x, k.y - 10);
      ctx.lineTo(k.x + 10, k.y);
      ctx.lineTo(k.x, k.y + 10);
      ctx.lineTo(k.x - 10, k.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner lantern glow
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(k.x, k.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Flowing silk ribbons
      const sway = Math.sin(time * 2 + k.x * 0.01) * 3;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(k.x - 4, k.y + 10);
      ctx.lineTo(k.x - 4 + sway, k.y + 22);
      ctx.moveTo(k.x + 4, k.y + 10);
      ctx.lineTo(k.x + 4 + sway, k.y + 22);
      ctx.stroke();
    });

    // 8. Low Carved Stone Perimeter Boundary Walls with Diya Niches
    const wallThickness = 16;
    ctx.fillStyle = '#261208';
    ctx.strokeStyle = '#3d1c0d';
    ctx.lineWidth = 2;

    // Top wall
    ctx.fillRect(0, 0, worldW, wallThickness);
    ctx.strokeRect(0, 0, worldW, wallThickness);
    // Bottom wall
    ctx.fillRect(0, worldH - wallThickness, worldW, wallThickness);
    ctx.strokeRect(0, worldH - wallThickness, worldW, wallThickness);
    // Left wall
    ctx.fillRect(0, 0, wallThickness, worldH);
    ctx.strokeRect(0, 0, wallThickness, worldH);
    // Right wall
    ctx.fillRect(worldW - wallThickness, 0, wallThickness, worldH);
    ctx.strokeRect(worldW - wallThickness, 0, wallThickness, worldH);

    // Warm glowing diyas in boundary wall niches
    for (let x = 100; x < worldW; x += 150) {
      GameRenderer.drawDiya(ctx, x, wallThickness / 2, 9, time + x * 0.05);
      GameRenderer.drawDiya(ctx, x, worldH - wallThickness / 2, 9, time + x * 0.05 + 1);
    }
    for (let y = 100; y < worldH; y += 140) {
      GameRenderer.drawDiya(ctx, wallThickness / 2, y, 9, time + y * 0.05 + 2);
      GameRenderer.drawDiya(ctx, worldW - wallThickness / 2, y, 9, time + y * 0.05 + 3);
    }
  }

  /**
   * Draw Authentic Physical Festival Slogans as in-world architectural decorations
   * 1. “गणपति बप्पा मोरया!” - Draped Ceremonial Silk Banner at South Entrance
   * 2. “श्री गणेशाय नमः” - Carved Wooden Toran Plaque above North Promenade
   * 3. “मंगलमूर्ति मोरया!” - Traditional Hanging Cloth Banner along West Promenade
   * 4. “जय गणेश महाराज की जय!” - Traditional Carved Timber Festival Board along East Promenade
   */
  public static drawFestivalDecorationsAndSlogans(
    ctx: CanvasRenderingContext2D,
    worldW: number,
    worldH: number,
    time: number
  ) {
    ctx.save();

    // =========================================================================
    // SLOGAN 1: “गणपति बप्पा मोरया!” (Grand Draped Saffron Silk Cloth Banner)
    // Located at South entrance promenade (x: 640, y: 720)
    // =========================================================================
    const bx = 640;
    const by = 718;
    const bannerW = 280;
    const bannerH = 38;
    const clothFlutter = Math.sin(time * 1.8) * 1.8;

    // Soft drop shadow cast on flagstone below
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(bx, by + 34, bannerW * 0.52, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ceremonial Wooden Posts flanking the entrance
    [-bannerW / 2 - 12, bannerW / 2 + 12].forEach(px => {
      // Post shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(bx + px, by + 28, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Teakwood post
      ctx.fillStyle = '#3E3028';
      ctx.fillRect(bx + px - 4, by - 32, 8, 60);
      ctx.strokeStyle = '#7A2E2E';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + px - 4, by - 32, 8, 60);

      // Brass Kalash finial atop post
      ctx.fillStyle = '#E8C766';
      ctx.beginPath();
      ctx.arc(bx + px, by - 34, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#C6A15B';
      ctx.stroke();

      // Spiral marigold garland wrapped around post
      ctx.fillStyle = '#C98232';
      for (let g = -24; g <= 20; g += 11) {
        ctx.beginPath();
        ctx.arc(bx + px, by + g, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Hanging suspension ropes
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - bannerW / 2 - 12, by - 24);
    ctx.lineTo(bx - bannerW / 2, by - 12);
    ctx.moveTo(bx + bannerW / 2 + 12, by - 24);
    ctx.lineTo(bx + bannerW / 2, by - 12);
    ctx.stroke();

    // Draped Saffron Silk Banner Body (with subtle curved folds)
    ctx.save();
    ctx.translate(0, clothFlutter);
    const bannerGrad = ctx.createLinearGradient(bx - bannerW / 2, by, bx + bannerW / 2, by);
    bannerGrad.addColorStop(0, '#7A2E2E');
    bannerGrad.addColorStop(0.25, '#C98232');
    bannerGrad.addColorStop(0.5, '#E8C766');
    bannerGrad.addColorStop(0.75, '#C98232');
    bannerGrad.addColorStop(1, '#7A2E2E');
    ctx.fillStyle = bannerGrad;

    ctx.beginPath();
    ctx.roundRect(bx - bannerW / 2, by - bannerH / 2, bannerW, bannerH, 6);
    ctx.fill();

    // Golden embroidered border with corner flourishes
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(bx - bannerW / 2 + 3, by - bannerH / 2 + 3, bannerW - 6, bannerH - 6);

    ctx.strokeStyle = 'rgba(246, 235, 216, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - bannerW / 2 + 6, by - bannerH / 2 + 6, bannerW - 12, bannerH - 12);

    // Golden fringe tassels along bottom of banner
    ctx.fillStyle = '#E8C766';
    for (let t = -bannerW / 2 + 8; t <= bannerW / 2 - 8; t += 14) {
      ctx.beginPath();
      ctx.moveTo(bx + t, by + bannerH / 2);
      ctx.lineTo(bx + t + 3, by + bannerH / 2 + 6);
      ctx.lineTo(bx + t - 3, by + bannerH / 2 + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Sacred Devanagari Inscription: “गणपति बप्पा मोरया!”
    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 16px "Yatra One", "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(62, 48, 40, 0.85)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fillText('॥ गणपति बप्पा मोरया! ॥', bx, by);
    ctx.restore();

    // =========================================================================
    // SLOGAN 2: “श्री गणेशाय नमः” (Carved Teakwood Toran Plaque near North promenade)
    // Located at (x: 640, y: 75)
    // =========================================================================
    const nx = 640;
    const ny = 62;
    const nW = 210;
    const nH = 26;

    // Plaque shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(nx - nW / 2 + 3, ny + 3, nW, nH, 6);
    ctx.fill();

    // Dark Teakwood board
    ctx.fillStyle = '#3E3028';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(nx - nW / 2, ny, nW, nH, 6);
    ctx.fill();
    ctx.stroke();

    // Marigold garland along top of board
    for (let g = -nW / 2 + 10; g <= nW / 2 - 10; g += 16) {
      ctx.fillStyle = '#C98232';
      ctx.beginPath();
      ctx.arc(nx + g, ny, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Devanagari text
    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 12px "Yatra One", "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(198, 161, 91, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText('॥ श्री गणेशाय नमः ॥', nx, ny + nH / 2);

    // =========================================================================
    // SLOGAN 3: “मंगलमूर्ति मोरया!” (Traditional Hanging Fabric Banner on West Promenade)
    // Located at (x: 240, y: 350)
    // =========================================================================
    const wx = 240;
    const wy = 350;
    const wW = 190;
    const wH = 30;
    const wSway = Math.sin(time * 1.5 + 1) * 1.5;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(wx, wy + 26, wW * 0.48, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden suspension rod
    ctx.fillStyle = '#3E3028';
    ctx.fillRect(wx - wW / 2 - 8, wy - wH / 2 - 4, wW + 16, 5);
    // Brass end knobs
    ctx.fillStyle = '#E8C766';
    ctx.beginPath();
    ctx.arc(wx - wW / 2 - 8, wy - wH / 2 - 1, 4, 0, Math.PI * 2);
    ctx.arc(wx + wW / 2 + 8, wy - wH / 2 - 1, 4, 0, Math.PI * 2);
    ctx.fill();

    // Fabric Banner Body (Cream with Saffron and Green borders)
    ctx.save();
    ctx.translate(0, wSway);
    ctx.fillStyle = '#7A2E2E';
    ctx.beginPath();
    ctx.roundRect(wx - wW / 2, wy - wH / 2, wW, wH, 4);
    ctx.fill();

    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(wx - wW / 2, wy - wH / 2, wW, wH);

    ctx.strokeStyle = '#244A3A'; // Forest green inner border
    ctx.lineWidth = 1;
    ctx.strokeRect(wx - wW / 2 + 3, wy - wH / 2 + 3, wW - 6, wH - 6);

    // Hanging marigold tassels
    ctx.fillStyle = '#C98232';
    ctx.beginPath();
    ctx.arc(wx - wW / 2 + 6, wy + wH / 2 + 4, 3, 0, Math.PI * 2);
    ctx.arc(wx + wW / 2 - 6, wy + wH / 2 + 4, 3, 0, Math.PI * 2);
    ctx.arc(wx, wy + wH / 2 + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Inscription
    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 12.5px "Yatra One", "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(62, 48, 40, 0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText('॥ मंगलमूर्ति मोरया! ॥', wx, wy);
    ctx.restore();

    // =========================================================================
    // SLOGAN 4: “जय गणेश महाराज की जय!” (Traditional Carved Timber Festival Board on East Promenade)
    // Located at (x: 1040, y: 350)
    // =========================================================================
    const ex = 1040;
    const ey = 350;
    const eW = 215;
    const eH = 30;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(ex, ey + 26, eW * 0.48, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Angled support legs
    ctx.strokeStyle = '#3E3028';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ex - eW / 3, ey + eH / 2);
    ctx.lineTo(ex - eW / 3 - 6, ey + eH / 2 + 22);
    ctx.moveTo(ex + eW / 3, ey + eH / 2);
    ctx.lineTo(ex + eW / 3 + 6, ey + eH / 2 + 22);
    ctx.stroke();

    // Carved wooden board
    ctx.fillStyle = '#3E3028';
    ctx.strokeStyle = '#C6A15B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ex - eW / 2, ey - eH / 2, eW, eH, 5);
    ctx.fill();
    ctx.stroke();

    // Brass corner brackets
    ctx.fillStyle = '#E8C766';
    const bOffset = 4;
    ctx.fillRect(ex - eW / 2 + bOffset, ey - eH / 2 + bOffset, 6, 6);
    ctx.fillRect(ex + eW / 2 - bOffset - 6, ey - eH / 2 + bOffset, 6, 6);
    ctx.fillRect(ex - eW / 2 + bOffset, ey + eH / 2 - bOffset - 6, 6, 6);
    ctx.fillRect(ex + eW / 2 - bOffset - 6, ey + eH / 2 - bOffset - 6, 6, 6);

    // Garland draped across top
    ctx.strokeStyle = '#C98232';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - eW / 2 + 8, ey - eH / 2);
    ctx.quadraticCurveTo(ex, ey - eH / 2 + 6, ex + eW / 2 - 8, ey - eH / 2);
    ctx.stroke();

    // Inscription: “जय गणेश महाराज की जय!”
    ctx.fillStyle = '#F6EBD8';
    ctx.font = 'bold 12px "Yatra One", "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(198, 161, 91, 0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText('॥ जय गणेश महाराज की जय! ॥', ex, ey);

    ctx.restore();
  }

  /**
   * Vector Drawing of a Traditional Steamed Modak
   */
  public static drawModakVector(ctx: CanvasRenderingContext2D, x: number, y: number, size = 28) {
    ctx.save();
    ctx.translate(x, y);

    // Base body (conical teardrop with pleats)
    const modakGrad = ctx.createLinearGradient(0, -size * 0.7, 0, size * 0.5);
    modakGrad.addColorStop(0, '#fef9c3'); // pure steamed rice/mawa flour
    modakGrad.addColorStop(0.5, '#fef08a');
    modakGrad.addColorStop(1, '#fde047');

    ctx.fillStyle = modakGrad;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.7); // peaked conical tip
    ctx.bezierCurveTo(size * 0.6, -size * 0.2, size * 0.7, size * 0.5, 0, size * 0.5);
    ctx.bezierCurveTo(-size * 0.7, size * 0.5, -size * 0.6, -size * 0.2, 0, -size * 0.7);
    ctx.closePath();
    ctx.fill();

    // Delicate pleats / folds
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.2;
    for (let p = -2; p <= 2; p++) {
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.7);
      ctx.quadraticCurveTo(p * size * 0.25, 0, p * size * 0.3, size * 0.5);
      ctx.stroke();
    }

    // Saffron strand dot at tip (Kesar)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(0, -size * 0.55, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Vector Drawing of Falling Feast Item (Target or Distraction)
   */
  public static drawFeastItem(ctx: CanvasRenderingContext2D, item: FallingFeastItem, time: number) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);
    ctx.globalAlpha = item.alpha;

    const s = item.size;

    // Glowing aura for items
    const isFood = item.type.category === 'food';
    const auraColor = isFood ? 'rgba(250, 204, 21, 0.35)' : 'rgba(148, 163, 184, 0.2)';
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.25, 0, Math.PI * 2);
    ctx.fill();

    switch (item.type.id) {
      case 'modak':
        GameRenderer.drawModakVector(ctx, 0, 0, s);
        break;

      case 'ladoo': {
        // Motichoor / Besan Ladoo
        const ladooGrad = ctx.createRadialGradient(-s * 0.2, -s * 0.2, s * 0.1, 0, 0, s * 0.6);
        ladooGrad.addColorStop(0, '#fef08a');
        ladooGrad.addColorStop(0.5, '#f59e0b');
        ladooGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = ladooGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Pistachio / nut specks
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(-s * 0.2, -s * 0.15, 3, 2);
        ctx.fillRect(s * 0.15, -s * 0.1, 2, 2.5);
        ctx.fillRect(0, s * 0.2, 2.5, 2);
        break;
      }

      case 'banana': {
        // Curved Ripe Banana
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, s * 0.3);
        ctx.quadraticCurveTo(0, -s * 0.5, s * 0.6, -s * 0.3);
        ctx.quadraticCurveTo(0, -s * 0.1, -s * 0.6, s * 0.3);
        ctx.fill();
        ctx.stroke();

        // Greenish stem tip
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(s * 0.55, -s * 0.38, 5, 5);
        break;
      }

      case 'mango': {
        // Golden Alfonso Mango
        const mangoGrad = ctx.createRadialGradient(-s * 0.15, -s * 0.15, s * 0.1, 0, 0, s * 0.65);
        mangoGrad.addColorStop(0, '#fef08a');
        mangoGrad.addColorStop(0.5, '#fb923c');
        mangoGrad.addColorStop(1, '#ea580c');
        ctx.fillStyle = mangoGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.55, s * 0.65, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Green Leaf
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(s * 0.2, -s * 0.6, s * 0.25, s * 0.12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'payasam': {
        // Terracotta sweet kheer bowl
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.2, s * 0.6, s * 0.35, 0, 0, Math.PI);
        ctx.fill();

        // Sweet white rice milk
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.55, s * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cashews & saffron
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(0, s * 0.08, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'pomegranate': {
        // Ruby Pomegranate
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(0, s * 0.05, s * 0.55, 0, Math.PI * 2);
        ctx.fill();
        // Crown calyx
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.45);
        ctx.lineTo(0, -s * 0.7);
        ctx.lineTo(s * 0.2, -s * 0.45);
        ctx.closePath();
        ctx.fill();
        // Ruby seeds window
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(0, s * 0.1, s * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        for (let sd = 0; sd < 5; sd++) {
          const sda = (sd * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(Math.cos(sda) * 6, s * 0.1 + Math.sin(sda) * 6, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      // DISTRACTIONS:
      case 'thali': {
        // Brass plate
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'flower': {
        // Marigold blossom
        const petalCount = 10;
        ctx.fillStyle = '#f97316';
        for (let p = 0; p < petalCount; p++) {
          const ang = (p * Math.PI * 2) / petalCount;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * s * 0.35, Math.sin(ang) * s * 0.35, s * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'gold_coin': {
        // Kubera Gold Coin
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₹', 0, 0);
        break;
      }

      case 'incense': {
        // Incense stand with smoke
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.3, s * 0.45, s * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.lineTo(0, -s * 0.4);
        ctx.stroke();
        // Glowing ember tip
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -s * 0.4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'temple_bell': {
        // Temple Ghanti Bell
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(-s * 0.45, s * 0.3);
        ctx.quadraticCurveTo(-s * 0.3, -s * 0.2, -s * 0.15, -s * 0.45);
        ctx.lineTo(s * 0.15, -s * 0.45);
        ctx.quadraticCurveTo(s * 0.3, -s * 0.2, s * 0.45, s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      }

      case 'clay_diya': {
        GameRenderer.drawDiya(ctx, 0, 0, s * 0.7, time);
        break;
      }

      default:
        // Generic fallback
        ctx.fillStyle = item.type.color;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  /**
   * Draw the Player's Golden Catching Thali (at the bottom of Kubera's Feast)
   */
  public static drawCatchingThali(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    combo: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Warm glow beneath thali
    const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, width * 0.7);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.65, height * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ornate Golden Plate Rim
    const thaliGrad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    thaliGrad.addColorStop(0, '#b45309');
    thaliGrad.addColorStop(0.2, '#fef08a');
    thaliGrad.addColorStop(0.5, '#f59e0b');
    thaliGrad.addColorStop(0.8, '#fef08a');
    thaliGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = thaliGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner embossed engraving
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 0.38, height * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Marigold Garland wrapped on edges
    ctx.fillStyle = '#f97316';
    const flowerDots = 12;
    for (let f = 0; f < flowerDots; f++) {
      const fa = (f * Math.PI * 2) / flowerDots;
      const fx = Math.cos(fa) * (width * 0.44);
      const fy = Math.sin(fa) * (height * 0.44);
      ctx.beginPath();
      ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // High combo visual aura!
    if (combo >= 4) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.54, height * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  /**
   * Signature Mechanic: Quick Celebratory Ganesha Reaction in a Screen Corner
   * Appears briefly when player collects correct food, happily enjoys the offering,
   * radiates festive sparkles & petals, and smoothly fades out.
   */
  public static drawGaneshaFeastReaction(
    ctx: CanvasRenderingContext2D,
    reaction: {
      corner: 'bottom-left' | 'bottom-right' | 'top-left';
      x: number;
      y: number;
      progress: number;
      foodName: string;
      foodId: string;
      blessingText: string;
      particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }>;
    },
    time: number
  ) {
    const p = reaction.progress; // 0 to 1
    if (p <= 0 || p >= 1) return;

    // Calculate smooth entrance spring & exit fade
    let scale = 1.0;
    let alpha = 1.0;
    let offsetY = 0;

    if (p < 0.2) {
      // Smooth spring entrance (0 to 1)
      const t = p / 0.2;
      // Overshoot spring curve
      scale = Math.sin((t * Math.PI) / 2) * 1.08;
      alpha = Math.min(1, t * 1.5);
      offsetY = (1 - t) * 25;
    } else if (p > 0.78) {
      // Smooth ease-out fade
      const t = (p - 0.78) / 0.22;
      scale = 1.0 - t * 0.15;
      alpha = Math.max(0, 1 - t * 1.2);
      offsetY = t * 20;
    } else {
      scale = 1.0 + Math.sin(time * 8) * 0.03;
      alpha = 1.0;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(reaction.x, reaction.y + offsetY);
    ctx.scale(scale, scale);

    // 1. Festive Corner Glow & Halo
    const haloRadius = 68;
    const haloGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, haloRadius);
    haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    haloGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.25)');
    haloGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Soft Ornate Golden Medallion Plinth / Backplate
    const bgGrad = ctx.createRadialGradient(0, -6, 10, 0, 0, 52);
    bgGrad.addColorStop(0, '#451a03'); // warm royal sandalwood
    bgGrad.addColorStop(0.85, '#270e04');
    bgGrad.addColorStop(1, '#180702');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    // Golden embossed border ring
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 44, time * 2, time * 2 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Radiating Golden Sunburst Rays behind Ganesha
    ctx.save();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
    ctx.lineWidth = 1.8;
    const rays = 12;
    for (let r = 0; r < rays; r++) {
      const rayAng = (r * Math.PI * 2) / rays + time * 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rayAng) * 32, Math.sin(rayAng) * 32);
      ctx.lineTo(Math.cos(rayAng) * 58, Math.sin(rayAng) * 58);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Respectful Ganesha Character Portrait
    ctx.save();
    ctx.translate(0, 4);

    // Shoulders & Pitambara (Golden Silk Robe)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 32, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Marigold garland on neck
    for (let g = -3; g <= 3; g++) {
      ctx.fillStyle = g % 2 === 0 ? '#f97316' : '#facc15';
      ctx.beginPath();
      ctx.arc(g * 7, 24, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ganesha Head & Temples (Gentle warm elephant head)
    const headGrad = ctx.createRadialGradient(-3, -2, 5, 0, 0, 24);
    headGrad.addColorStop(0, '#fed7aa'); // auspicious sandalwood tone
    headGrad.addColorStop(0.7, '#f97316');
    headGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fan-shaped Elephant Ears (Gajakarna) with gentle happy flap
    const earFlap = Math.sin(time * 12) * 2;
    // Left Ear
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(-22, -2 + earFlap * 0.5, 12, 16, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(254, 205, 211, 0.45)'; // pink inner ear
    ctx.beginPath();
    ctx.ellipse(-23, -2 + earFlap * 0.5, 7, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(22, -2 - earFlap * 0.5, 12, 16, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(254, 205, 211, 0.45)';
    ctx.beginPath();
    ctx.ellipse(23, -2 - earFlap * 0.5, 7, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Golden Ear Kundalas
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-29, 6, 2.5, 0, Math.PI * 2);
    ctx.arc(29, 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Ivory Tusks
    // Right Ekadanta
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(7, 8);
    ctx.quadraticCurveTo(14, 11, 16, 16);
    ctx.quadraticCurveTo(11, 13, 6, 10);
    ctx.closePath();
    ctx.fill();
    // Broken Left Tusk
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(-7, 8);
    ctx.lineTo(-11, 11);
    ctx.lineTo(-6, 10);
    ctx.closePath();
    ctx.fill();

    // Blissful, Joyful Eyes (Crescent Smiling Arcs of Contentment)
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    // Left eye smiling curve
    ctx.beginPath();
    ctx.arc(-8, -4, 4, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    // Right eye smiling curve
    ctx.beginPath();
    ctx.arc(8, -4, 4, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Eye sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -5.5, 1, 0, Math.PI * 2);
    ctx.arc(8, -5.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Forehead: Chandan Tripundra & Kumkum Tilak
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, -11);
    ctx.lineTo(5, -11);
    ctx.moveTo(-4, -13);
    ctx.lineTo(4, -13);
    ctx.stroke();

    ctx.fillStyle = '#dc2626'; // Vermillion Tilak
    ctx.beginPath();
    ctx.ellipse(0, -12, 1.8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a'; // Golden bindi
    ctx.beginPath();
    ctx.arc(0, -9.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Ornate Golden Crown (Kiritamukuta)
    const crownGrad = ctx.createLinearGradient(0, -18, 0, -38);
    crownGrad.addColorStop(0, '#f59e0b');
    crownGrad.addColorStop(0.6, '#fbbf24');
    crownGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.moveTo(-13, -18);
    ctx.lineTo(-10, -28);
    ctx.lineTo(0, -38);
    ctx.lineTo(10, -28);
    ctx.lineTo(13, -18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Crown Ruby jewel
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, -26, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Crown tip golden finial
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -38, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Animated Trunk (Vakratunda) enjoying the delicious sweet offering!
    const munchChew = Math.sin(time * 16) * 2;
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(-5, 14, -12, 16 + munchChew);
    ctx.quadraticCurveTo(-18, 16, -16, 9 + munchChew);
    ctx.stroke();

    // Golden bands on trunk
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 9);
    ctx.lineTo(-2, 11);
    ctx.moveTo(-9, 13);
    ctx.lineTo(-7, 15);
    ctx.stroke();

    // The caught food item held happily right in trunk's grasp!
    ctx.save();
    ctx.translate(-16, 8 + munchChew);
    if (reaction.foodId === 'modak') {
      GameRenderer.drawModakVector(ctx, 0, 0, 15);
    } else {
      // Golden ladoo or sweet fruit
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-1.5, -1.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore(); // end Ganesha bust

    // 5. Speech / Blessing Pill Label
    ctx.save();
    // Place pill on inner side based on corner
    let labelX = reaction.corner === 'bottom-right' ? -65 : 65;
    let labelY = reaction.corner === 'top-left' ? 36 : -36;

    ctx.fillStyle = 'rgba(20, 8, 4, 0.94)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.font = 'bold 11px Outfit, sans-serif';
    const tagText = reaction.blessingText || 'Yum! +10';
    const tagW = ctx.measureText(tagText).width + 20;
    const tagH = 26;

    ctx.beginPath();
    ctx.roundRect(labelX - tagW / 2, labelY - tagH / 2, tagW, tagH, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, labelX, labelY);
    ctx.restore();

    // 6. Celebratory Particles around Ganesha
    reaction.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = pt.alpha * alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  /**
   * Draw active particles (sparks, petals, floating score text)
   */
  public static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
}
