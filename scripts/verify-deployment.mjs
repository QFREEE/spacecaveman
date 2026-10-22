import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const assets = (html) =>
  [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)]
    .map((match) => match[1])
    .sort();

export function assertPublishedHomepage(expected, actual) {
  assert.match(
    expected,
    /Yuntong/,
    "The local build itself contains the old homepage",
  );
  const title = (html) => /<title>(.*?)<\/title>/s.exec(html)?.[1];
  assert.equal(
    title(actual),
    title(expected),
    "The public homepage has the wrong identity",
  );
  assert.ok(
    assets(expected).length >= 2,
    "The local build has no frontend assets",
  );
  assert.deepEqual(
    assets(actual),
    assets(expected),
    "The public homepage serves a different build",
  );
}

export async function verifyDeployment(
  base = "https://spacecaveman.com",
  directory = resolve("dist/site"),
) {
  base = base.replace(/\/$/, "");
  const expected = await readFile(resolve(directory, "index.html"), "utf8");
  async function get(path, status = 200) {
    let failure;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(`${base}${path}`, {
          headers: { "Cache-Control": "no-cache" },
          signal: AbortSignal.timeout(15_000),
          redirect: "error",
        });
        assert.equal(
          response.status,
          status,
          `${path}: unexpected HTTP status`,
        );
        return response;
      } catch (error) {
        failure = error;
        if (attempt < 2)
          await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    throw new Error(`${path} verification failed`, { cause: failure });
  }
  const homepage = await get("/");
  assert.match(homepage.headers.get("content-type") || "", /text\/html/);
  assertPublishedHomepage(expected, await homepage.text());
  for (const path of assets(expected)) {
    const actual = await get(path);
    assert.equal(
      await actual.text(),
      await readFile(resolve(directory, path.slice(1)), "utf8"),
      `${path}: stale asset content`,
    );
  }
  for (const path of [
    "/api/visits",
    "/api/visitors",
    "/api/flower",
    "/api/presence/public",
  ]) {
    const response = await get(path);
    assert.equal(
      response.headers.get("cache-control"),
      "no-store",
      `${path}: unsafe caching`,
    );
    const body = await response.json();
    if (path === "/api/visits") {
      assert.deepEqual(body.visits, []);
      assert.equal(body.demo, undefined);
    } else if (path === "/api/visitors") {
      assert.ok(
        Number.isSafeInteger(body.views) && body.views >= 0,
        "Expected a real page-view aggregate",
      );
    } else if (path === "/api/flower") {
      for (const stat of ["rain", "sun", "love", "food"])
        assert.ok(
          Number.isInteger(body.stats[stat]) &&
            body.stats[stat] >= 0 &&
            body.stats[stat] <= 3,
        );
      assert.ok(Array.isArray(body.log));
    } else {
      assert.ok(["in_nyc", "not_in_nyc", "unknown"].includes(body.status));
      assert.deepEqual(Object.keys(body).sort(), [
        "expires_at",
        "observed_at",
        "status",
      ]);
    }
    console.log(`Verified ${path}`);
  }
  await get("/api/presence", 401);
  for (const path of [
    "/shortcuts",
    "/shortcuts/",
    "/shortcuts.html",
    "/shortcuts.css",
  ])
    await get(path, 410);
  console.log(
    "Verified current homepage assets, public APIs and private/retired routes.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await verifyDeployment(process.argv[2]);
}
