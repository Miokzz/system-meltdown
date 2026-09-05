import { type ReactNode, useLayoutEffect, useState } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import { PMREMGenerator, Scene } from "three";

/** Own the filtered target instead of leaving cube captures in the renderer cache. */
export default function StudioEnvironment({
  children,
  resolution,
}: {
  children: ReactNode;
  resolution: number;
}) {
  const get = useThree((s) => s.get);
  const [studio] = useState(() => new Scene());
  useLayoutEffect(() => {
    const { gl, scene } = get();
    const previous = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    const generator = new PMREMGenerator(gl);
    const target = generator.fromScene(studio, 0, 0.1, 1000, {
      size: resolution,
    });
    generator.dispose();
    scene.environment = target.texture;
    scene.environmentIntensity = 0.84;
    return () => {
      if (scene.environment === target.texture) {
        scene.environment = previous;
        scene.environmentIntensity = previousIntensity;
      }
      target.dispose();
    };
  }, [get, studio, resolution]);
  return createPortal(children, studio);
}
