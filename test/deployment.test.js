import { test } from "node:test";
import assert from "node:assert/strict";
import { assertPublishedHomepage } from "../scripts/verify-deployment.mjs";

const latest =
  '<title>Yuntong’s space</title><script src="/assets/current.js"></script><link href="/assets/current.css">';
test("deployment verification rejects the old demo and an older build with the same title", () => {
  assert.throws(
    () =>
      assertPublishedHomepage(
        latest,
        latest.replace("Yuntong’s space", "Space Caveman · My little Qzone"),
      ),
    /wrong identity/,
  );
  assert.throws(
    () =>
      assertPublishedHomepage(
        latest,
        latest.replaceAll("/assets/current", "/assets/previous"),
      ),
    /different build/,
  );
  assert.throws(
    () =>
      assertPublishedHomepage(
        latest.replace("Yuntong’s space", "Space Caveman"),
        latest,
      ),
    /local build itself/,
  );
  assert.doesNotThrow(() => assertPublishedHomepage(latest, latest));
});
