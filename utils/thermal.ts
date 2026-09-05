/** Art-directed lumped thermal model, not measurements of the visitor's hardware. */
export const thermal = {
  cpu: 36,
  gpu: 32,
  vrm: 31,
  rpm: 640,
  load: 12,
  power: 180,
  heat: 0,
  memory: 18,
};
export function updateThermal(
  dt: number,
  progress: number,
  failure: number,
  phase: string,
  workload = -1,
) {
  const dead = phase === "blackout" || phase === "destroyed";
  const load = dead
    ? 0
    : workload >= 0
      ? workload
      : Math.min(100, 12 + progress * 102 + failure * 30);
  const mix = 1 - Math.exp(-Math.min(dt, 0.1) * 1.8);
  thermal.load += (load - thermal.load) * mix;
  const heat = Math.max(0, (progress - 0.42) / 0.58);
  const cpuTarget = dead
    ? 26
    : 30 + thermal.load * 0.46 + heat * 28 + failure * 26;
  thermal.cpu += (cpuTarget - thermal.cpu) * (1 - Math.exp(-dt * 0.7));
  thermal.gpu +=
    (cpuTarget - 5 + thermal.load * 0.05 - thermal.gpu) * mix * 0.55;
  thermal.vrm += (cpuTarget - 9 - thermal.vrm) * mix * 0.45;
  thermal.rpm +=
    ((dead ? 0 : 520 + thermal.load * 19 + failure * 650) - thermal.rpm) *
    mix *
    0.55;
  thermal.power = dead ? 0 : Math.round(110 + thermal.load * 7.8);
  thermal.memory = 12 + thermal.load * 0.42;
  thermal.heat = Math.max(0, Math.min(1, (thermal.cpu - 48) / 57));
}
