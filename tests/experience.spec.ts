import { test, expect } from "@playwright/test";
test("desktop: reversible scroll, physics, recovery and developer mode", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 45000,
  });
  await page.screenshot({ path: "artifacts/verified-entry.png" });
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "SYSTEM MELTDOWN logo" }).click();
  await expect(page.getByText("DEVELOPER MODE", { exact: true })).toBeVisible();
  await page.waitForTimeout(1000);
  const positions = () =>
    page.evaluate(() =>
      JSON.parse(
        JSON.stringify(
          (window as unknown as { __SYSTEM_DIAGNOSTICS__: unknown })
            .__SYSTEM_DIAGNOSTICS__,
        ),
      ),
    );
  const assembled = await positions();
  await page.getByRole("button", { name: "Chapter 5: ANATOMY" }).click();
  await expect(page.getByRole("heading", { name: "EXPOSED 05" })).toBeVisible();
  await page.waitForTimeout(2500);
  const exploded = await positions();
  expect(
    Math.abs(exploded.bodies.gpu.x - assembled.bodies.gpu.x),
  ).toBeGreaterThan(2);
  await page.screenshot({ path: "artifacts/verified-anatomy.png" });
  await page.getByRole("button", { name: "Chapter 1: CONTAINMENT" }).click();
  await page.waitForTimeout(2800);
  const restored = await positions();
  expect(Math.abs(restored.bodies.gpu.x - assembled.bodies.gpu.x)).toBeLessThan(
    0.05,
  );
  await page.getByRole("button", { name: "SOUND OFF" }).click();
  await expect(page.getByRole("button", { name: "SOUND ON" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Chapter 6: INSTABILITY" }).click();
  await expect(
    page.getByRole("button", { name: "DO NOT PRESS" }),
  ).toBeVisible();
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "DO NOT PRESS" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-phase", "armed");
  await page.waitForTimeout(4200);
  const falling = await positions();
  expect(
    Object.values(falling.bodies).filter(
      (v) => (v as { dynamic: boolean }).dynamic,
    ).length,
  ).toBeGreaterThan(5);
  await page.screenshot({ path: "artifacts/verified-physics.png" });
  await expect(
    page.getByRole("heading", { name: "you had one job." }),
  ).toBeVisible({ timeout: 14000 });
  expect((await positions()).collisions).toBeGreaterThan(0);
  await page.screenshot({ path: "artifacts/verified-ending.png" });
  await page.getByRole("button", { name: "TRY AGAIN" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-phase", "rebuild");
  await page.screenshot({ path: "artifacts/verified-rebuilding.png" });
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 10000,
  });
  await page.waitForTimeout(1000);
  const rebuilt = await positions();
  expect(Math.abs(rebuilt.bodies.gpu.x - assembled.bodies.gpu.x)).toBeLessThan(
    0.05,
  );
  expect(errors).toEqual([]);
});
test("mobile: complete interaction at 390px, no overflow or WebGL failure", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 45000,
  });
  await page.screenshot({ path: "artifacts/verified-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Chapter 5: ANATOMY" }).click();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: "artifacts/verified-mobile-exploded.png" });
  await page.getByRole("button", { name: "Chapter 6: INSTABILITY" }).click();
  await page.getByRole("button", { name: "DO NOT PRESS" }).click();
  await expect(
    page.getByRole("heading", { name: "you had one job." }),
  ).toBeVisible({ timeout: 16000 });
  await page.getByRole("button", { name: "TRY AGAIN" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 10000,
  });
  expect(errors).toEqual([]);
});
