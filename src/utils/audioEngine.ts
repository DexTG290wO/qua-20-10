/**
 * Web Audio API Procedural Sound Engine
 * Synthesizes all SFX and background melody directly in the browser.
 * No external MP3/WAV files required -> 100% offline, zero 404s, instant response.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isBgmPlaying) {
      this.stopBgm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- PROCEDURAL SOUND EFFECTS ---

  /** Box dropping from sky and hitting ground */
  public playBoxDrop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** Box rattle / shake */
  public playBoxShake() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.08);
    osc.frequency.linearRampToValueAtTime(280, now + 0.16);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Box lid opening / burst of magical light */
  public playBoxOpen() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  /** CS2 Roulette tick when passing each item */
  public playRouletteTick(pitchMultiplier: number = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.025);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  /** Roulette stops on item */
  public playRouletteStop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Normal reward reveal */
  public playWinNormal() {
    this.playChord([523.25, 659.25, 783.99], 0.5, 'sine');
  }

  /** Rare reward reveal */
  public playWinRare() {
    this.playArpeggio([523.25, 659.25, 783.99, 1046.5], 0.09, 0.7);
  }

  /** Epic reward reveal */
  public playWinEpic() {
    this.playArpeggio([440, 554.37, 659.25, 880, 1108.73], 0.08, 0.9);
  }

  /** Secret reward reveal: Grand magical fanfare */
  public playWinSecret() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const sequence = [
      { f: 587.33, t: 0.0 },  // D5
      { f: 739.99, t: 0.12 }, // F#5
      { f: 880.00, t: 0.24 }, // A5
      { f: 1174.66, t: 0.36 }, // D6
      { f: 1479.98, t: 0.52 }, // F#6
      { f: 1760.00, t: 0.68 }, // A6
    ];

    const now = this.ctx.currentTime;
    sequence.forEach(({ f, t }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.25, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.8);
    });

    // Sub rumble for grandeur
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(80, now);
    bass.frequency.linearRampToValueAtTime(140, now + 0.8);
    bassGain.gain.setValueAtTime(0.3, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    bass.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bass.start(now);
    bass.stop(now + 1.2);
  }

  /** Fireworks sound */
  public playFirework() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Launch whistle
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // Burst pop
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const bNow = this.ctx.currentTime;
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(180, bNow);
      bOsc.frequency.exponentialRampToValueAtTime(40, bNow + 0.25);
      bGain.gain.setValueAtTime(0.25, bNow);
      bGain.gain.exponentialRampToValueAtTime(0.001, bNow + 0.25);
      bOsc.connect(bGain);
      bGain.connect(this.ctx.destination);
      bOsc.start(bNow);
      bOsc.stop(bNow + 0.25);
    }, 200);
  }

  /** Wax seal break & envelope open */
  public playEnvelopeOpen() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Crisp wax snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // Gentle paper swoosh
    const paper = this.ctx.createOscillator();
    const pGain = this.ctx.createGain();
    paper.type = 'triangle';
    paper.frequency.setValueAtTime(300, now + 0.1);
    paper.frequency.linearRampToValueAtTime(550, now + 0.4);
    pGain.gain.setValueAtTime(0.08, now + 0.1);
    pGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    paper.connect(pGain);
    pGain.connect(this.ctx.destination);
    paper.start(now + 0.1);
    paper.stop(now + 0.45);
  }

  /** Typewriter character tap */
  public playTypewriterTap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const randFreq = 650 + Math.random() * 200;
    osc.frequency.setValueAtTime(randFreq, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /** Click feedback */
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- BACKGROUND MUSIC: Soft Fantasy Music-Box Melody ---

  public startBgm() {
    if (this.isBgmPlaying || this.isMuted) return;
    this.initContext();
    this.isBgmPlaying = true;

    // Peaceful pentatonic melody notes (C major / A minor pentatonic: C4, D4, E4, G4, A4, C5, E5, G5)
    const melody = [
      523.25, 659.25, 783.99, 659.25,
      523.25, 440.00, 392.00, 440.00,
      523.25, 659.25, 880.00, 783.99,
      659.25, 523.25, 587.33, 523.25
    ];

    let noteIdx = 0;
    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted || !this.isBgmPlaying || !this.ctx) return;
      const freq = melody[noteIdx % melody.length];
      noteIdx++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    }, 650);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public toggleBgm(): boolean {
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  public getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  // --- PRIVATE HELPERS ---
  private playChord(freqs: number[], duration: number, type: OscillatorType) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  private playArpeggio(freqs: number[], stepTime: number, decay: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * stepTime);
      gain.gain.setValueAtTime(0.15, now + i * stepTime);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * stepTime + decay);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * stepTime);
      osc.stop(now + i * stepTime + decay);
    });
  }
}

export const audioEngine = new AudioEngine();
