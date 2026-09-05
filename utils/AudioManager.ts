import type { ImpactMaterial } from "./physics";
export interface AudioMix {
  rpm: number;
  load: number;
  silence: boolean;
  macro: boolean;
  failure: boolean;
  speed?: number;
}
/** Gesture-gated procedural audio. No samples, autoplay, network assets or unbounded voices. */
class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: GainNode | null = null;
  private airGain: GainNode | null = null;
  private airFilter: BiquadFilterNode | null = null;
  private motor: OscillatorNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private continuous: AudioScheduledSourceNode[] = [];
  private noise: AudioBuffer | null = null;
  private enabled = false;
  private voices = 0;
  private lastImpact = -1;
  private lastMix = -1;
  async toggle(enabled: boolean) {
    this.enabled = enabled;
    if (!this.context && enabled) {
      const ctx = new AudioContext();
      this.context = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -14;
      this.compressor.knee.value = 16;
      this.compressor.ratio.value = 5;
      this.compressor.attack.value = 0.006;
      this.compressor.release.value = 0.22;
      this.master.connect(this.compressor).connect(ctx.destination);
      this.ambience = ctx.createGain();
      this.ambience.gain.value = 0.8;
      this.ambience.connect(this.master);
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i++) {
        brown = (brown + (Math.random() * 2 - 1) * 0.06) / 1.02;
        data[i] = brown * 3.8;
      }
      const air = ctx.createBufferSource();
      air.buffer = this.noise;
      air.loop = true;
      this.airFilter = ctx.createBiquadFilter();
      this.airFilter.type = "lowpass";
      this.airFilter.frequency.value = 420;
      this.airGain = ctx.createGain();
      this.airGain.gain.value = 0.1;
      air.connect(this.airFilter).connect(this.airGain).connect(this.ambience);
      air.start();
      this.continuous.push(air);
      for (const [frequency, volume] of [
        [50, 0.04],
        [100.3, 0.012],
        [31, 0.025],
      ]) {
        const tone = ctx.createOscillator(),
          gain = ctx.createGain();
        tone.frequency.value = frequency;
        tone.type = "sine";
        gain.gain.value = volume;
        tone.connect(gain).connect(this.ambience);
        tone.start();
        this.continuous.push(tone);
        if (frequency === 31) this.motor = tone;
      }
    }
    if (this.context && this.master) {
      await this.context.resume();
      this.master.gain.setTargetAtTime(
        enabled ? 0.52 : 0,
        this.context.currentTime,
        0.14,
      );
    }
  }
  updateMix(mix: AudioMix) {
    const ctx = this.context;
    if (
      !ctx ||
      !this.ambience ||
      !this.enabled ||
      ctx.currentTime - this.lastMix < 0.045
    )
      return;
    const t = ctx.currentTime;
    this.lastMix = t;
    this.ambience.gain.setTargetAtTime(
      mix.silence ? 0.005 : mix.macro ? 0.42 : 0.82,
      t,
      mix.silence ? 0.075 : 0.4,
    );
    this.airGain?.gain.setTargetAtTime(
      0.045 + mix.rpm / 20000 + (mix.failure ? 0.03 : 0),
      t,
      0.25,
    );
    this.airFilter?.frequency.setTargetAtTime(
      240 + mix.rpm * 0.22 + mix.load * 3,
      t,
      0.3,
    );
    this.motor?.frequency.setTargetAtTime(
      (25 + mix.rpm / 65) * (mix.speed ?? 1),
      t,
      0.3,
    );
  }
  private resonant(
    frequencies: number[],
    duration: number,
    volume: number,
    pan = 0,
    sweep = 1,
  ) {
    const ctx = this.context,
      output = this.master;
    if (!ctx || !output || !this.enabled || this.voices > 18) return;
    this.voices++;
    const gain = ctx.createGain(),
      stereo = ctx.createStereoPanner(),
      t = ctx.currentTime;
    stereo.pan.value = Math.max(-0.8, Math.min(0.8, pan));
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    gain.connect(stereo).connect(output);
    const nodes = frequencies.map((frequency, i) => {
      const o = ctx.createOscillator(),
        partial = ctx.createGain();
      o.frequency.setValueAtTime(frequency, t);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(12, frequency * sweep),
        t + duration,
      );
      partial.gain.value = 1 / (1 + i * 1.5);
      o.connect(partial).connect(gain);
      o.start(t);
      o.stop(t + duration);
      return { o, partial };
    });
    nodes[0].o.onended = () => {
      for (const node of nodes) {
        node.o.disconnect();
        node.partial.disconnect();
      }
      gain.disconnect();
      stereo.disconnect();
      this.voices = Math.max(0, this.voices - 1);
    };
  }
  private noiseHit(duration: number, volume: number, cutoff: number, pan = 0) {
    const ctx = this.context,
      output = this.master;
    if (!ctx || !output || !this.noise || !this.enabled) return;
    const n = ctx.createBufferSource(),
      g = ctx.createGain(),
      f = ctx.createBiquadFilter(),
      stereo = ctx.createStereoPanner(),
      t = ctx.currentTime;
    n.buffer = this.noise;
    f.type = "highpass";
    f.frequency.value = cutoff;
    stereo.pan.value = Math.max(-0.8, Math.min(0.8, pan));
    g.gain.setValueAtTime(Math.max(0.001, volume), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    n.connect(f).connect(g).connect(stereo).connect(output);
    n.start(t, Math.random() * 1.5);
    n.stop(t + duration);
    n.onended = () => {
      n.disconnect();
      f.disconnect();
      g.disconnect();
      stereo.disconnect();
    };
  }
  impact(
    a: ImpactMaterial,
    b: ImpactMaterial,
    speed: number,
    mass: number,
    pan = 0,
  ) {
    const ctx = this.context;
    if (
      !ctx ||
      !this.enabled ||
      speed < 0.22 ||
      ctx.currentTime - this.lastImpact < 0.045
    )
      return;
    this.lastImpact = ctx.currentTime;
    const force = Math.min(1, Math.sqrt(Math.max(0.003, mass)) * speed * 0.27);
    const variation = 0.91 + Math.random() * 0.18;
    if (a === "rubber" || b === "rubber") {
      this.noiseHit(0.07, 0.05 + force * 0.1, 180, pan);
    } else if (a === "glass" || b === "glass") {
      this.resonant(
        [1180, 1947, 3120, 4670].map((v) => v * variation),
        0.45,
        0.035 + force * 0.12,
        pan,
      );
      this.noiseHit(0.1, force * 0.09, 2000, pan);
    } else if (a === "plastic" || b === "plastic") {
      this.resonant(
        [270, 480, 1100].map((v) => v * variation),
        0.105,
        0.025 + force * 0.16,
        pan,
        0.87,
      );
      this.noiseHit(0.06, force * 0.1, 700, pan);
    } else {
      const small = mass < 0.02;
      this.resonant(
        (small ? [1760, 2788, 4160] : [430, 683, 1217, 2230]).map(
          (v) => v * variation,
        ),
        small ? 0.32 : 0.24,
        0.025 + force * 0.14,
        pan,
      );
      this.noiseHit(0.04, force * 0.16, 800, pan);
      if (mass > 1 && speed > 1.2)
        this.resonant([49, 74], 0.32, force * 0.11, pan, 0.65);
    }
  }
  play(
    kind:
      | "click"
      | "metal"
      | "energy"
      | "glitch"
      | "screw"
      | "connector"
      | "restore",
  ) {
    if (kind === "metal") {
      this.impact("metal", "metal", 1.6, 0.3);
      return;
    }
    if (kind === "energy" || kind === "restore") {
      this.resonant(
        kind === "energy" ? [37, 56, 113] : [95, 143, 286],
        1.1,
        0.18,
        0,
        kind === "energy" ? 0.42 : 2.1,
      );
      this.noiseHit(0.45, 0.06, 600);
    } else if (kind === "glitch") {
      this.resonant([197, 711, 1241], 0.11, 0.055, 0, 0.35);
      this.noiseHit(0.065, 0.11, 1700);
    } else if (kind === "screw") {
      this.resonant([1890, 3140, 4670], 0.36, 0.075, 0.35);
    } else {
      this.resonant(
        kind === "connector" ? [390, 790] : [680, 1360],
        0.065,
        0.055,
        0,
        0.75,
      );
      this.noiseHit(0.027, 0.1, 1400);
    }
  }
  dispose() {
    for (const source of this.continuous) {
      try {
        source.stop();
      } catch {
        /* Already stopped by context teardown. */
      }
      source.disconnect();
    }
    this.continuous = [];
    this.master?.disconnect();
    this.compressor?.disconnect();
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.ambience = null;
    this.motor = null;
    this.airGain = null;
    this.airFilter = null;
    this.noise = null;
    this.compressor = null;
    this.voices = 0;
    this.lastImpact = -1;
    this.lastMix = -1;
    this.enabled = false;
  }
}
export const audio = new AudioManager();
