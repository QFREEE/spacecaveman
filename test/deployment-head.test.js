import { test } from "node:test";
import assert from "node:assert/strict";
import { isLatestMain } from "../scripts/check-deployment-head.mjs";

const sha = "a".repeat(40);
const context = {
  ref: "refs/heads/main",
  sha,
  repository: "QFREEE/spacecaveman",
  token: "test-token",
};
const response = (sha) => async () =>
  new Response(JSON.stringify({ object: { sha } }));

test("only the latest main commit may deploy; queued and rerun older commits are skipped", async () => {
  assert.equal(await isLatestMain(context, response(sha)), true);
  assert.equal(await isLatestMain(context, response("b".repeat(40))), false);
});

test("a branch dispatch cannot deploy even when its SHA equals main", async () => {
  assert.equal(
    await isLatestMain({ ...context, ref: "refs/heads/feature" }, () => {
      throw new Error("must not request");
    }),
    false,
  );
});

test("the guard reads the live main ref using the read-only workflow token", async () => {
  await isLatestMain(context, async (url, options) => {
    assert.equal(
      url,
      "https://api.github.com/repos/QFREEE/spacecaveman/git/ref/heads/main",
    );
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.equal(options.cache, "no-store");
    return new Response(JSON.stringify({ object: { sha } }));
  });
});

test("API errors, malformed refs and missing credentials fail closed", async () => {
  await assert.rejects(
    isLatestMain(
      context,
      async () => new Response("Unavailable", { status: 503 }),
    ),
    /503/,
  );
  await assert.rejects(
    isLatestMain(context, response(undefined)),
    /Invalid main SHA/,
  );
  await assert.rejects(
    isLatestMain({ ...context, token: "" }, response(sha)),
    /Missing/,
  );
});
