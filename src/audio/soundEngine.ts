/**
 * Web Audio API Procedural Sound Engine for Ganesha — Stories of Wisdom
 * Pure procedural synthesis: Temple bells, tanpura drone, bansuri flute tones,
 * festive chimes, and crisp UI sounds without external audio files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientRunning: boolean = false;
  private riverGain: GainNode | null = null;
  private riverNodes: AudioNode[] = [];
  private riverRunning: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const savedMute = localStorage.getItem('ganesha_audio_muted');
    if (savedMute === 'true') {
      this.isMuted = true;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('ganesha_audio_muted', String(this.isMuted));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime, 0.1);
    }
    if (this.riverGain && this.ctx) {
      this.riverGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.045, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play a resonant brass temple bell (Ghanti)
  public playTempleBell(pitchMultiplier = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreq = 880 * pitchMultiplier;

    // Harmonic bell frequencies (metal strike physics)
    const partials = [1, 1.52, 2.05, 2.76, 3.48];
    const amplitudes = [0.35, 0.25, 0.15, 0.1, 0.05];

    partials.forEach((p, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq * p, t);

      // Natural metal exponential decay
      const decay = 2.5 / (idx + 1);
      gain.gain.setValueAtTime(amplitudes[idx] * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + decay);
    });
  }

  // Correct Food Collected: Sparkling ascending pentatonic chime
  public playCollectFood(combo: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Raga Mohanam / Pentatonic notes: C, D, E, G, A
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const noteIdx = Math.min(scale.length - 1, (combo - 1) % scale.length);
    const freq = scale[noteIdx];

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  // High Combo milestone: Melodic flourish
  public playComboStreak(combo: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * (1 + (combo % 3) * 0.1), startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  // Ganesha happy food enjoyment / divine blessing sound
  public playGaneshaMunch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Harmonious sweet bells + gentle pleasant chime
    [659.25, 783.99, 987.77, 1318.51].forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      osc.frequency.exponentialRampToValueAtTime(f * 1.05, start + 0.1);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.32);
    });
  }

  // Mistake / Heart lost: Gentle warning sound
  public playMistake() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.25);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    // Warm low-pass filter to keep it pleasant and not harsh
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // UI Button Click / Interaction whoosh
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Chapter Enter / Gate sound
  public playEnterChapter() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.playTempleBell(1.2);
    setTimeout(() => {
      this.playTempleBell(1.5);
    }, 180);
  }

  // Feast Over Gong
  public playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(196, t); // G3
    osc.frequency.linearRampToValueAtTime(174.61, t + 1.2); // F3

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.5);
  }

  // Scribe writing stroke sound
  public playInkStroke() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580 + Math.random() * 120, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Bappa Match: Crisp card flip whoosh
  public playCardFlip() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.07);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Bappa Match: Joyful card match chime
  public playCardMatch(streak: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const pitchShift = Math.min(1.4, 1 + (streak - 1) * 0.08);

    baseFreqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * pitchShift, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * pitchShift * 1.05, startTime + 0.18);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // Bappa Match: Gentle playful mismatch boing
  public playCardMismatch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.18);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Bappa Match: Urgent countdown tick during final 5 seconds
  public playUrgentTick(secondsRemaining: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Higher pitch as seconds decrease
    const freq = 600 + (6 - Math.max(1, secondsRemaining)) * 120;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Bappa Match: Wisdom Unlocked Glorious Victory Fanfare
  public playWisdomUnlocked() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [
      [523.25, 659.25, 783.99], // C major
      [659.25, 783.99, 987.77], // E minor / higher
      [783.99, 987.77, 1174.66], // G major
      [1046.5, 1318.51, 1567.98] // High C major victory
    ];

    chords.forEach((chord, chordIdx) => {
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + chordIdx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    });

    setTimeout(() => {
      this.playTempleBell(1.5);
    }, 450);
  }

  // Tusk moment: Dramatic snap + resonant divine temple bell chord
  public playTuskBreak() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Snapping sound (crisp filtered noise burst + sharp decay)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(320, t);
    snapOsc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    snapGain.gain.setValueAtTime(0.35, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(t);
    snapOsc.stop(t + 0.1);

    // Divine golden chord resonant surge
    setTimeout(() => {
      this.playTempleBell(1.0);
      this.playTempleBell(1.5);
    }, 120);
  }

  // Ink Refill Success: Sparkling ascending chime
  public playRefillSuccess() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }

  // Speed Challenge: Surge fanfare
  public playSpeedSurge() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  // Final 5-second countdown sound (played once per second at 5, 4, 3, 2, 1)
  public playTimerTick(second: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Crisp woodblock / temple tick with ascending pitch as tension builds:
    // 5 -> 650Hz, 4 -> 710Hz, 3 -> 780Hz, 2 -> 860Hz, 1 -> 950Hz
    const clampedSec = Math.max(1, Math.min(5, second));
    const freq = 650 + (5 - clampedSec) * 75;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.75, t + 0.06);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Mushika obstacle collision thud sound
  public playObstacleHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Play Mushika hop / jump sound
  public playHop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(560, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Play Water Splash sound when falling in river
  public playWaterSplash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  // Countdown beep for 3, 2, 1, GO!
  public playCountdownBeep(count: number | string) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const isGo = count === 0 || count === 'GO';
    const freq = isGo ? 987.77 : 587.33; // B5 for GO, D5 for numbers
    const dur = isGo ? 0.35 : 0.12;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.15); // ascending cheer
    }

    gain.gain.setValueAtTime(isGo ? 0.3 : 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + dur);
  }

  // Celebratory fanfare when reaching Ganesha with all modaks
  public playMushikaCelebration() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Ascending festive chord: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  // Time's Up sound: Distinct, solemn cue when timer reaches 0
  public playTimeUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Two-tone descending chime (E4 -> C4) followed by resonant low gong note
    const notes = [
      { freq: 329.63, start: t, dur: 0.14 },
      { freq: 261.63, start: t + 0.09, dur: 0.5 },
      { freq: 130.81, start: t + 0.12, dur: 0.8 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, start + dur);

      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  }

  // Start peaceful ambient drone (Tanpura Root D & Fifth A)
  public startAmbient() {
    if (this.ambientRunning) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      // Low Tanpura frequencies: D2 (73.4Hz), A2 (110Hz), D3 (146.8Hz)
      const freqs = [73.42, 110.0, 146.83];
      freqs.forEach(f => {
        if (!this.ctx || !this.ambientGain) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;

        const pGain = this.ctx.createGain();
        pGain.gain.value = 0.3;

        // Subtle LFO for breathing drone vibration
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 0.2 + Math.random() * 0.15;
        lfoGain.gain.value = 0.1;
        lfo.connect(lfoGain.gain);

        osc.connect(pGain);
        pGain.connect(this.ambientGain);
        osc.start();
        lfo.start();
      });

      this.ambientRunning = true;
    } catch {
      // Audio context might fail before gesture, safe to ignore
    }
  }

  // Start subtle, satisfying procedural flowing river / water ambience for River Crossing
  public startRiverAmbience() {
    if (this.riverRunning) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.stopRiverAmbience();

      const sampleRate = this.ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * 2.5); // 2.5-second loopable noise buffer
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate brown/pink noise curve for gentle rushing water texture
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.2; // normalize volume
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter 1: Low-pass filter for smooth water current
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(380, this.ctx.currentTime);
      lowpass.Q.setValueAtTime(1.2, this.ctx.currentTime);

      // Filter 2: Bandpass filter for gentle water surface ripple
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(620, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

      // LFO 1: Slow undulating current wave (0.15 Hz)
      const lfo1 = this.ctx.createOscillator();
      lfo1.type = 'sine';
      lfo1.frequency.setValueAtTime(0.15, this.ctx.currentTime);

      const lfoGain1 = this.ctx.createGain();
      lfoGain1.gain.setValueAtTime(140, this.ctx.currentTime);
      lfo1.connect(lfoGain1);
      lfoGain1.connect(lowpass.frequency);

      // LFO 2: Secondary gentle ripple phase (0.28 Hz)
      const lfo2 = this.ctx.createOscillator();
      lfo2.type = 'sine';
      lfo2.frequency.setValueAtTime(0.28, this.ctx.currentTime);

      const lfoGain2 = this.ctx.createGain();
      lfoGain2.gain.setValueAtTime(90, this.ctx.currentTime);
      lfo2.connect(lfoGain2);
      lfoGain2.connect(bandpass.frequency);

      // Master River Gain (subtle, peaceful, non-intrusive)
      this.riverGain = this.ctx.createGain();
      const targetVol = this.isMuted ? 0 : 0.045;
      this.riverGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.riverGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.6);

      // Connect graph
      whiteNoise.connect(lowpass);
      whiteNoise.connect(bandpass);
      lowpass.connect(this.riverGain);
      bandpass.connect(this.riverGain);
      this.riverGain.connect(this.ctx.destination);

      whiteNoise.start();
      lfo1.start();
      lfo2.start();

      this.riverNodes = [whiteNoise, lowpass, bandpass, lfo1, lfo2, lfoGain1, lfoGain2];
      this.riverRunning = true;
    } catch {
      // Audio context might fail before gesture, safe to ignore
    }
  }

  // Smoothly fade out and stop river ambience
  public stopRiverAmbience() {
    if (!this.riverRunning && this.riverNodes.length === 0) return;
    try {
      if (this.riverGain && this.ctx) {
        this.riverGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      }
      const nodesToStop = [...this.riverNodes];
      setTimeout(() => {
        nodesToStop.forEach(n => {
          try {
            if ('stop' in n && typeof (n as AudioScheduledSourceNode).stop === 'function') {
              (n as AudioScheduledSourceNode).stop();
            }
            n.disconnect();
          } catch {}
        });
      }, 400);
    } catch {}
    this.riverNodes = [];
    this.riverGain = null;
    this.riverRunning = false;
  }
}

export const soundEngine = new SoundEngine();
