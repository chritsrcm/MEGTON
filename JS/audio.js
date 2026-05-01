/**
 * SOUND - Efeitos sonoros sintetizados via Web Audio.
 */
const Sound = {
  ctx: null,
  master: null,
  unlocked: false,
  enabled: true,

  unlock() {
    if (!this.enabled || this.unlocked) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      this.enabled = false;
      return;
    }

    this.ctx = this.ctx || new AudioContext();
    this.master = this.master || this.ctx.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.ctx.destination);

    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.unlocked = true;
  },

  tone(freq, duration, type = 'square', volume = 0.5, slideTo = null) {
    if (!this.unlocked || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration);
  },

  noise(duration, volume = 0.35) {
    if (!this.unlocked || !this.ctx) return;

    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
  },

  play(name) {
    if (!this.enabled) return;
    this.unlock();

    switch (name) {
      case 'dash':
        this.tone(220, 0.12, 'sawtooth', 0.35, 880);
        this.noise(0.08, 0.12);
        break;
      case 'damage':
        this.tone(190, 0.12, 'square', 0.45, 80);
        this.noise(0.12, 0.2);
        break;
      case 'death':
        this.tone(220, 0.18, 'triangle', 0.45, 90);
        setTimeout(() => this.tone(120, 0.25, 'sawtooth', 0.35, 45), 90);
        this.noise(0.25, 0.25);
        break;
      case 'powerup':
        this.tone(440, 0.08, 'square', 0.35, 660);
        setTimeout(() => this.tone(660, 0.08, 'square', 0.3, 990), 70);
        break;
      case 'boss':
        this.tone(75, 0.35, 'sawtooth', 0.45, 45);
        this.noise(0.2, 0.18);
        break;
      case 'complete':
        [392, 494, 587, 784].forEach((freq, i) => {
          setTimeout(() => this.tone(freq, 0.12, 'square', 0.3), i * 85);
        });
        break;
      case 'star':
        this.tone(880, 0.08, 'triangle', 0.28, 1320);
        break;
      default:
        this.tone(330, 0.08, 'square', 0.2);
    }
  }
};
