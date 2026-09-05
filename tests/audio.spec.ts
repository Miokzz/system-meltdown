import { test, expect } from "@playwright/test";

test("audio is gesture-gated, produces signal and respects mute", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const nativeConnect = AudioNode.prototype.connect;
    const probe = { contexts: 0, analyser: null as AnalyserNode | null };
    Object.defineProperty(window, "__AUDIO_PROBE__", { value: probe });
    // Observe only the application's output, without recording microphone audio.
    AudioNode.prototype.connect = function (
      this: AudioNode,
      ...args: Parameters<AudioNode["connect"]>
    ) {
      const result = Reflect.apply(nativeConnect, this, args);
      if (args[0] instanceof AudioDestinationNode) {
        probe.contexts++;
        const analyser = this.context.createAnalyser();
        probe.analyser = analyser;
        analyser.fftSize = 2048;
        Reflect.apply(nativeConnect, this, [analyser]);
      }
      return result;
    } as AudioNode["connect"];
  });
  const signal = () =>
    page.evaluate(() => {
      const p = (
        window as unknown as {
          __AUDIO_PROBE__: { contexts: number; analyser: AnalyserNode | null };
        }
      ).__AUDIO_PROBE__;
      const samples = new Float32Array(2048);
      p.analyser?.getFloatTimeDomainData(samples);
      return {
        contexts: p.contexts,
        rms: Math.sqrt(samples.reduce((a, b) => a + b * b, 0) / samples.length),
        peak: Math.max(...samples.map(Math.abs)),
      };
    });
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 45000,
  });
  expect((await signal()).contexts).toBe(0);
  await page.getByRole("button", { name: "SOUND OFF" }).click();
  await page.waitForTimeout(1000);
  const enabled = await signal();
  expect(enabled.contexts).toBe(1);
  expect(enabled.rms).toBeGreaterThan(0.00001);
  expect(enabled.peak).toBeLessThan(0.99);
  await page.getByRole("button", { name: "SOUND ON" }).click();
  await page.waitForTimeout(1100);
  expect((await signal()).rms).toBeLessThan(enabled.rms * 0.02);
});
