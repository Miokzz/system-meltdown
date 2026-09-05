import { test, expect } from "@playwright/test";
test("GPU warnings, physical drop and developer drag-to-throw", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 45000,
  });
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "SYSTEM MELTDOWN logo" }).click();
  await page.waitForTimeout(1800);
  const read = (id: string) =>
    page.evaluate(
      (key) =>
        (
          window as unknown as {
            __SYSTEM_DIAGNOSTICS__: {
              bodies: Record<
                string,
                {
                  screenX: number;
                  screenY: number;
                  x: number;
                  y: number;
                  z: number;
                  dynamic: boolean;
                }
              >;
            };
          }
        ).__SYSTEM_DIAGNOSTICS__.bodies[key],
      id,
    );
  async function touchGPU(times: number) {
    for (let i = 0; i < times; i++) {
      const gpu = await read("gpu");
      await page.mouse.click(gpu.screenX, gpu.screenY);
      await page.waitForTimeout(80);
    }
  }
  await touchGPU(5);
  await expect(page.getByRole("status")).toHaveText("STOP TOUCHING THE GPU.");
  await touchGPU(3);
  await expect(page.getByRole("status")).toHaveText("I’M SERIOUS.");
  await touchGPU(3);
  await expect(page.getByRole("status")).toHaveText("fine.");
  await page.waitForTimeout(1100);
  expect((await read("gpu")).dynamic).toBe(true);
  await page.screenshot({ path: "artifacts/verified-gpu-easter-egg.png" });
  await page.getByRole("button", { name: "Chapter 5: ANATOMY" }).click();
  await page.waitForTimeout(2600);
  const before = await read("cooler");
  await page.mouse.move(before.screenX, before.screenY);
  await page.mouse.down();
  await page.mouse.move(before.screenX + 140, before.screenY - 70, {
    steps: 16,
  });
  await page.mouse.up();
  await page.waitForTimeout(750);
  const after = await read("cooler");
  expect(after.dynamic).toBe(true);
  expect(
    Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z),
  ).toBeGreaterThan(0.4);
  await page.screenshot({ path: "artifacts/verified-throw.png" });
});
