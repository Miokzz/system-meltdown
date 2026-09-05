import { useEffect } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Vec3 } from "../parts";
import { hardwareMaterials, type MaterialName } from "./materials";

export type Batch = {
  geometry: THREE.BufferGeometry;
  material: MaterialName;
}[];

/** Mechanical detail is merged by material inside each independent rigid body. */
export class ModelBuilder {
  private buckets = new Map<MaterialName, THREE.BufferGeometry[]>();
  add(
    material: MaterialName,
    geometry: THREE.BufferGeometry,
    position: Vec3 = [0, 0, 0],
    rotation: Vec3 = [0, 0, 0],
  ) {
    geometry.rotateX(rotation[0]);
    geometry.rotateY(rotation[1]);
    geometry.rotateZ(rotation[2]);
    geometry.translate(...position);
    const normalized = geometry.index ? geometry.toNonIndexed() : geometry;
    if (normalized !== geometry) geometry.dispose();
    const bucket = this.buckets.get(material) ?? [];
    bucket.push(normalized);
    this.buckets.set(material, bucket);
    return this;
  }
  box(
    material: MaterialName,
    size: Vec3,
    position?: Vec3,
    radius = 0,
    rotation?: Vec3,
  ) {
    return this.add(
      material,
      radius
        ? new RoundedBoxGeometry(...size, 1, radius)
        : new THREE.BoxGeometry(...size),
      position,
      rotation,
    );
  }
  cylinder(
    material: MaterialName,
    radius: number,
    height: number,
    position?: Vec3,
    rotation: Vec3 = [Math.PI / 2, 0, 0],
    segments = 16,
  ) {
    return this.add(
      material,
      new THREE.CylinderGeometry(radius, radius, height, segments),
      position,
      rotation,
    );
  }
  ring(
    material: MaterialName,
    radius: number,
    thickness: number,
    position?: Vec3,
    rotation?: Vec3,
    segments = 48,
  ) {
    return this.add(
      material,
      new THREE.TorusGeometry(radius, thickness, 6, segments),
      position,
      rotation,
    );
  }
  tube(material: MaterialName, points: Vec3[], radius: number, segments = 32) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    return this.add(
      material,
      new THREE.TubeGeometry(curve, segments, radius, 8, false),
    );
  }
  screw(x: number, y: number, z: number, radius = 0.022) {
    this.cylinder(
      "steel",
      radius,
      radius * 0.4,
      [x, y, z],
      [Math.PI / 2, 0, 0],
      12,
    );
    this.box(
      "chips",
      [radius * 1.25, radius * 0.22, 0.001],
      [x, y, z + radius * 0.21],
    );
    this.box(
      "chips",
      [radius * 0.22, radius * 1.25, 0.001],
      [x, y, z + radius * 0.22],
    );
    return this;
  }
  label(
    index: number,
    width: number,
    height: number,
    position: Vec3,
    rotation?: Vec3,
  ) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const uv = geometry.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setY(i, (7 - index + uv.getY(i)) / 8);
    return this.add("labels", geometry, position, rotation);
  }
  finish(): Batch {
    return Array.from(this.buckets, ([material, sources]) => {
      const geometry = mergeGeometries(sources, false)!;
      geometry.computeBoundingSphere();
      sources.forEach((source) => source.dispose());
      return { material, geometry };
    });
  }
}

export function GeometryBatch({
  batch,
  raycast = true,
}: {
  batch: Batch;
  raycast?: boolean;
}) {
  useEffect(
    () => () => batch.forEach(({ geometry }) => geometry.dispose()),
    [batch],
  );
  const materials = hardwareMaterials();
  return (
    <group dispose={null}>
      {batch.map(({ material, geometry }) => (
        <mesh
          key={material}
          geometry={geometry}
          material={materials[material]}
          castShadow={
            material !== "glass" &&
            material !== "glassEdge" &&
            material !== "led"
          }
          receiveShadow
          raycast={raycast ? undefined : () => {}}
        />
      ))}
    </group>
  );
}
