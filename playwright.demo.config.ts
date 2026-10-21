import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./demo/e2e",
  outputDir: "./outputs/qzone-test-results",
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "outputs/qzone-test-report", open: "never" }],
  ],
  use: {
    launchOptions: { args: ["--autoplay-policy=user-gesture-required"] },
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "phone",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "pnpm demo:dev",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
