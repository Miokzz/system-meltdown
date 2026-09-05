/** Synthesized audio: no remote assets, and no context before a user gesture. */
class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private fan: OscillatorNode | null = null;
  private lastImpact = 0;
  async toggle(enabled: boolean) {
    if (!this.context && enabled) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);
      this.fan = this.context.createOscillator();
      this.fan.type = "sawtooth";
      this.fan.frequency.value = 48;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 100;
      const gain = this.context.createGain();
      gain.gain.value = 0.12;
      this.fan.connect(filter).connect(gain).connect(this.master);
      this.fan.start();
    }
    if (this.context && this.master) {
      await this.context.resume();
      this.master.gain.setTargetAtTime(
        enabled ? 0.25 : 0,
        this.context.currentTime,
        0.2,
      );
    }
  }
  play(kind: "click" | "metal" | "energy" | "glitch" | "screw") {
    if (!this.context || !this.master) return;
    const t = this.context.currentTime;
    if (kind === "metal" && t - this.lastImpact < 0.09) return;
    if (kind === "metal") this.lastImpact = t;
    const o = this.context.createOscillator(),
      g = this.context.createGain();
    const duration = kind === "energy" ? 1.4 : kind === "screw" ? 0.35 : 0.14;
    o.type = kind === "glitch" ? "square" : "sine";
    o.frequency.setValueAtTime(
      kind === "metal"
        ? 780
        : kind === "energy"
          ? 55
          : kind === "screw"
            ? 180
            : 1100,
      t,
    );
    o.frequency.exponentialRampToValueAtTime(
      kind === "energy" ? 420 : 50,
      t + duration,
    );
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + duration);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  dispose() {
    this.fan?.stop();
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.fan = null;
  }
}
export const audio = new AudioManager();
