/**
 * Procedural Audio Synthesizer for Quill
 * Uses browser-native Web Audio API (AudioContext) to synthesize
 * ambient soundscapes 100% client-side without any audio files or network requests.
 */

export type SoundscapeType = "rain" | "vinyl" | "clock" | "waves" | "wind";

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentType: SoundscapeType | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private intervalIds: number[] = [];

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        throw new Error("Web Audio API is not supported in this browser");
      }
      this.ctx = new AudioCtor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Create a 2-second looped pink/brown noise buffer
  private createNoiseBuffer(ctx: AudioContext, type: "pink" | "brown" | "white" = "pink"): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === "pink") {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else if (type === "brown") {
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else {
        output[i] = white * 0.2;
      }
    }
    return buffer;
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        Math.max(0, Math.min(1, volume)),
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public play(type: SoundscapeType) {
    const ctx = this.initContext();
    this.stop();

    this.currentType = type;
    this.isPlaying = true;

    switch (type) {
      case "rain":
        this.playRain(ctx);
        break;
      case "vinyl":
        this.playVinyl(ctx);
        break;
      case "clock":
        this.playClock(ctx);
        break;
      case "waves":
        this.playWaves(ctx);
        break;
      case "wind":
        this.playWind(ctx);
        break;
    }
  }

  private playRain(ctx: AudioContext) {
    // 1. Steady rain body: low-pass pink noise
    const noiseBuffer = this.createNoiseBuffer(ctx, "pink");
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;

    noiseSource.connect(filter);
    filter.connect(this.masterGain!);
    noiseSource.start();
    this.activeNodes.push(noiseSource, filter);

    // 2. Randomized raindrop impulses
    const dropInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dropFreq = 1200 + Math.random() * 1400;

      osc.frequency.setValueAtTime(dropFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04 + Math.random() * 0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }, 120);

    this.intervalIds.push(dropInterval);
  }

  private playVinyl(ctx: AudioContext) {
    // 1. Warm low rumble
    const rumbleBuffer = this.createNoiseBuffer(ctx, "brown");
    const rumbleSource = ctx.createBufferSource();
    rumbleSource.buffer = rumbleBuffer;
    rumbleSource.loop = true;

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.value = 240;

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(this.masterGain!);
    rumbleSource.start();
    this.activeNodes.push(rumbleSource, rumbleFilter);

    // 2. Periodic dust crackles
    const crackleInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      if (Math.random() > 0.4) {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.015, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
        }

        const click = ctx.createBufferSource();
        click.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.value = 0.08 + Math.random() * 0.12;

        click.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        click.start();
      }
    }, 80);

    this.intervalIds.push(crackleInterval);
  }

  private playClock(ctx: AudioContext) {
    // Rhythmic mechanical typewriter / clock tick every 1000ms
    let toggle = false;
    const tickInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      toggle = !toggle;
      const freq = toggle ? 950 : 750;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    }, 1000);

    this.intervalIds.push(tickInterval);
  }

  private playWaves(ctx: AudioContext) {
    // Oscillating bandpass ocean waves
    const noiseBuffer = this.createNoiseBuffer(ctx, "pink");
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 400;
    filter.Q.value = 1.2;

    // LFO to slowly sweep the wave frequency up and down
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1; // 10 second wave cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noiseSource.connect(filter);
    filter.connect(this.masterGain!);
    noiseSource.start();

    this.activeNodes.push(noiseSource, filter, lfo, lfoGain);
  }

  private playWind(ctx: AudioContext) {
    const noiseBuffer = this.createNoiseBuffer(ctx, "brown");
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noiseSource.connect(filter);
    filter.connect(this.masterGain!);
    noiseSource.start();

    this.activeNodes.push(noiseSource, filter, lfo, lfoGain);
  }

  public playChime() {
    const ctx = this.initContext();
    // Warm Tibetan-style chime (528Hz + 1056Hz harmonic overtone)
    const fundamental = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    fundamental.frequency.setValueAtTime(528, ctx.currentTime);
    harmonic.frequency.setValueAtTime(1056, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2);

    fundamental.connect(gain);
    harmonic.connect(gain);
    gain.connect(ctx.destination);

    fundamental.start();
    harmonic.start();
    fundamental.stop(ctx.currentTime + 3.2);
    harmonic.stop(ctx.currentTime + 3.2);
  }

  public stop() {
    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds = [];

    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentType = null;
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentType: this.currentType,
    };
  }
}

export const soundscapes = new SoundscapeEngine();
