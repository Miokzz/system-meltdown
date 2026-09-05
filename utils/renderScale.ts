/** One UHD frame: prevents supersampling from allocating oversized render targets. */
export const MAX_RENDER_PIXELS = 3840 * 2160;

export function calculateRenderScale(
  width: number,
  height: number,
  desiredDpr: number,
  maxTextureSize: number,
) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  return Math.min(
    desiredDpr,
    Math.sqrt(MAX_RENDER_PIXELS / (w * h)),
    maxTextureSize / w,
    maxTextureSize / h,
  );
}
