/** Read-only telemetry exposed only after the developer Easter egg. */
export const diagnostics = {
  collisions: 0,
  frames: 0,
  bodies: {} as Record<
    string,
    {
      x: number;
      y: number;
      z: number;
      dynamic: boolean;
      screenX: number;
      screenY: number;
    }
  >,
  quality: "high",
};
