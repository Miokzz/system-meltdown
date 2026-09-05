import * as THREE from "three";

/** Tiny, deterministic surface maps. A single atlas serves the entire machine. */
function surfaceMap(size: number, brushed = false) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const grain = Math.sin(y * 13.371) * 4 + Math.sin(y * 1.713) * 3;
    for (let x = 0; x < size; x++) {
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const noise = (hash - Math.floor(hash) - 0.5) * 12;
      const scratch = brushed && y % 43 === 0 && x > (y % 7) * 20 ? -14 : 0;
      const value = Math.round(219 + noise + (brushed ? grain : 0) + scratch);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  const map = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.repeat.set(brushed ? 2 : 3, brushed ? 8 : 3);
  map.needsUpdate = true;
  return map;
}

function labelAtlas() {
  if (typeof document === "undefined") return new THREE.Texture();
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#152022";
  c.fillRect(0, 0, 1024, 512);
  const labels = [
    ["MELTDOWN", "RTX / EXPERIMENTAL     ·     UNIT 06"],
    ["NEXUS X99", "ENGINEERING SAMPLE     REV. 06 / 2026"],
    ["CORTEX / 96", "PROCESSOR     ·     6.2 GHz     ·     192 THREADS"],
    ["ION / 1600", "TITANIUM     ·     1600 W     ·     FULLY MODULAR"],
    ["NVMe / 04", "4 TB     PCIe GEN 6     ·     M.2 2280"],
    ["DDR6 / 64", "6400 MT/s     ·     ENGINEERING SAMPLE"],
    ["FLOW / 360", "CLOSED LOOP     ·     LIQUID COOLING"],
    ["SYSTEM / 06", "EXPERIMENTAL HARDWARE     ·     DO NOT SERVICE"],
  ];
  labels.forEach(([title, subtitle], i) => {
    const y = i * 64;
    c.fillStyle = "#bccbc6";
    c.font = "500 28px monospace";
    c.fillText(title, 24, y + 28);
    c.font = "15px monospace";
    c.fillStyle = "#738c84";
    c.fillText(subtitle, 24, y + 51);
    for (let n = 0; n < 47; n++) {
      c.fillStyle = n % 3 === 0 ? "#d8ded6" : "#849188";
      c.fillRect(840 + n * 3, y + 14, n % 3 === 0 ? 2 : 1, 28);
    }
  });
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

function braidNormal() {
  const data = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      data[i] = 128 + Math.round(Math.sin(((x + y) * Math.PI) / 8) * 30);
      data[i + 1] = 128 + Math.round(Math.sin(((x - y) * Math.PI) / 8) * 30);
      data[i + 2] = 250;
      data[i + 3] = 255;
    }
  const map = new THREE.DataTexture(data, 128, 128, THREE.RGBAFormat);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 7);
  map.needsUpdate = true;
  return map;
}

export function createMaterials() {
  const brushedMap = surfaceMap(256, true);
  const roughMap = surfaceMap(128);
  const standard = (color: string, metalness: number, roughness: number) =>
    new THREE.MeshPhysicalMaterial({
      color,
      metalness,
      roughness,
      roughnessMap: metalness > 0.7 ? brushedMap : roughMap,
      envMapIntensity: 1,
    });
  const mats = {
    anodized: standard("#344044", 0.9, 0.36),
    brushed: standard("#a8b6b7", 0.98, 0.28),
    steel: standard("#849394", 1, 0.23),
    copper: standard("#af7149", 0.98, 0.3),
    gold: standard("#c6a758", 0.95, 0.29),
    pcb: standard("#123027", 0.18, 0.62),
    traces: standard("#456252", 0.62, 0.51),
    plastic: standard("#131a1c", 0, 0.48),
    fanBlade: standard("#465157", 0.08, 0.42),
    rubber: standard("#151b1a", 0, 0.88),
    braid: standard("#283332", 0.08, 0.84),
    chips: standard("#14191b", 0.12, 0.51),
    silk: standard("#7c9089", 0.15, 0.65),
    paint: standard("#222e33", 0.55, 0.43),
    gpuShroud: standard("#637273", 0.95, 0.28),
    pumpCover: standard("#243337", 0.7, 0.25),
    cpuLid: standard("#b4beb9", 0.98, 0.25),
    gpuCore: standard("#353947", 0.82, 0.2),
    vrm: standard("#4e6063", 0.85, 0.34),
    led: new THREE.MeshPhysicalMaterial({
      color: "#b9dce7",
      roughness: 0.25,
      metalness: 0.15,
      emissive: "#9fc4d4",
      emissiveIntensity: 1.25,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#e7f0ec",
      metalness: 0,
      roughness: 0.013,
      transmission: 0.98,
      thickness: 0.045,
      ior: 1.52,
      attenuationColor: "#78a99e",
      attenuationDistance: 2.5,
      envMapIntensity: 1.2,
      clearcoat: 1,
      clearcoatRoughness: 0.026,
      roughnessMap: roughMap,
      transparent: true,
      opacity: 1,
      side: THREE.FrontSide,
    }),
    glassEdge: new THREE.MeshPhysicalMaterial({
      color: "#668c83",
      metalness: 0.22,
      roughness: 0.19,
      transparent: true,
      opacity: 0.38,
      envMapIntensity: 1.25,
    }),
    labels: new THREE.MeshStandardMaterial({
      map: labelAtlas(),
      roughness: 0.68,
      metalness: 0.2,
    }),
  };
  // Brushed roughness provides directional surface breakup without derivative
  // tangents, which can yield NaNs on tiny merged mechanical faces in ANGLE.
  mats.pcb.clearcoat = 0.18;
  mats.pcb.clearcoatRoughness = 0.45;
  mats.pumpCover.clearcoat = 0.55;
  mats.pumpCover.clearcoatRoughness = 0.2;
  mats.braid.normalMap = braidNormal();
  mats.braid.normalScale.set(0.5, 0.5);
  return mats;
}
export type MaterialName = keyof ReturnType<typeof createMaterials>;
let cachedMaterials: ReturnType<typeof createMaterials> | undefined;
export function hardwareMaterials() {
  return (cachedMaterials ??= createMaterials());
}

/** Called when the owning model leaves the canvas, not when individual parts move. */
export function disposeHardwareMaterials() {
  if (!cachedMaterials) return;
  const maps = new Set<THREE.Texture>();
  for (const material of Object.values(cachedMaterials)) {
    if (material.map) maps.add(material.map);
    if (material.roughnessMap) maps.add(material.roughnessMap);
    if (material.normalMap) maps.add(material.normalMap);
    material.dispose();
  }
  maps.forEach((map) => map.dispose());
}
