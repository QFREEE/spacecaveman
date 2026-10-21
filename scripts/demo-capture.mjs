import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const directory = "outputs/qzone-qa";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const width of [1440, 1280, 390, 320, 430]) {
  await page.setViewportSize({ width, height: width > 720 ? 1000 : 844 });
  await page.goto("http://127.0.0.1:4173/");
  await page
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode())),
    );
  await page.screenshot({ path: `${directory}/${width}.png`, fullPage: true });
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:4173/");
await page
  .getByRole("button", { name: "Open album: Let's see the sea" })
  .click();
await page.screenshot({ path: `${directory}/phone-album.png` });
await page.getByRole("button", { name: "Close album" }).click();
await page.getByLabel("Your name").fill("Summer visitor");
await page.getByLabel("Your message").fill("Saving a little sunshine here.");
await page.getByRole("button", { name: "Post message" }).click();
await page.screenshot({ path: `${directory}/phone-guestbook.png` });
await page.getByRole("button", { name: "中文", exact: true }).click();
await page.goto("http://127.0.0.1:4173/#home");
await page.screenshot({ path: `${directory}/phone-chinese.png` });
await browser.close();
console.log(`Saved browser evidence in ${directory}`);
