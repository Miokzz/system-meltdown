import { test, expect } from "@playwright/test";

test("inspection spectra, quality presets, paused photo orbit and PNG export", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 45000,
  });
  await page.getByRole("button", { name: "LAB TOOLS" }).click();
  await page.getByLabel("RENDER QUALITY").selectOption("ultra");
  await page.waitForTimeout(2200);
  await page.screenshot({ path: "artifacts/upgrade-ultra-hero.png" });
  await page.getByRole("button", { name: "X-RAY", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "X-RAY", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(650);
  await page.screenshot({ path: "artifacts/upgrade-xray.png" });
  await page.getByRole("button", { name: "THERMAL", exact: true }).click();
  await page.waitForTimeout(650);
  await page.screenshot({ path: "artifacts/upgrade-thermal.png" });
  await page.getByRole("button", { name: "NORMAL", exact: true }).click();
  await page.getByRole("button", { name: "Close controls" }).click();
  await page.getByRole("button", { name: "Chapter 3: GRAPHICS" }).click();
  await page.waitForTimeout(2400);
  await page.screenshot({ path: "artifacts/upgrade-gpu-macro.png" });
  await page.getByRole("button", { name: "PHOTO MODE" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-photo", "true");
  await expect(page.getByLabel("PAUSE SIMULATION")).toBeChecked();
  await page.getByRole("slider", { name: "FOCAL LENGTH" }).fill("75");
  await page.getByRole("slider", { name: "EXPOSURE" }).fill("1.2");
  await page.mouse.move(600, 450);
  await page.mouse.down();
  await page.mouse.move(780, 410, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CAPTURE FRAME" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^system-meltdown-.*\.png$/);
  await download.saveAs("artifacts/upgrade-photo-export.png");
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).toHaveAttribute("data-photo", "false");
  expect(errors).toEqual([]);
});

test("developer benchmark autopilot, safe terminal and reduced effects", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 45000,
  });
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "SYSTEM MELTDOWN logo" }).click();
  await page.getByRole("button", { name: "LAB / DEV" }).click();
  await page.getByLabel("REDUCE FLASHES").check();
  await page.getByLabel("SM:// CONSOLE").fill("gravity off");
  await page.getByLabel("SM:// CONSOLE").press("Enter");
  await expect(
    page.getByText("GRAVITY CONTAINMENT: ZERO", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("SM:// CONSOLE").fill("gravity on");
  await page.getByLabel("SM:// CONSOLE").press("Enter");
  await page.getByLabel("SM:// CONSOLE").fill("repair");
  await page.getByLabel("SM:// CONSOLE").press("Enter");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 10000,
  });
  await page.getByRole("button", { name: "RUN BENCHMARK" }).click();
  await expect(page.getByText(/AVG ·/)).toBeVisible({ timeout: 20000 });
  const metrics = await page.evaluate(() =>
    JSON.parse(
      JSON.stringify(
        (window as unknown as { __SYSTEM_DIAGNOSTICS__: unknown })
          .__SYSTEM_DIAGNOSTICS__,
      ),
    ),
  );
  expect(metrics.benchmark.frames).toBeGreaterThan(10);
  expect(metrics.benchmark.draws).toBeGreaterThan(5);
  await expect(
    page.getByRole("heading", { name: "you had one job." }),
  ).toBeVisible({ timeout: 16000 });
  await page.getByRole("button", { name: "TRY AGAIN" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-phase", "running", {
    timeout: 10000,
  });
  expect(errors).toEqual([]);
});
