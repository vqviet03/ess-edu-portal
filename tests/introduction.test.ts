import { test } from "node:test";
import assert from "node:assert/strict";
import { introductionResponse } from "../infra/student-api-proxy/introduction";
import { defaultContent } from "../src/features/introduction/models";
const env = {
  PUBLIC_ORIGIN: "https://eeslern.com",
  API_ORIGIN: "https://backend.example.com",
};
test("published landing is semantic SEO HTML without JS, escapes manager text and never forwards viewer credentials", async () => {
  let calls = 0;
  const send: typeof fetch = async (input, init) => {
    calls++;
    assert.equal(String(input), "https://backend.example.com/v1/introduction");
    assert.deepEqual(init?.headers, { accept: "application/json" });
    return Response.json({
      data: {
        content: {
          ...defaultContent,
          texts: {
            ...defaultContent.texts,
            heroTitle: '<script>alert("bad")</script>',
            metaTitle: 'EES " > <unsafe>',
          },
        },
        version: 3,
        publishedAt: "2026-10-16T00:00:00Z",
      },
    });
  };
  const response = await introductionResponse(
    new Request("https://eeslern.com/", {
      headers: { authorization: "Bearer private", cookie: "private" },
    }),
    env,
    send,
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<h1>&lt;script&gt;/);
  assert.match(html, /<title>EES &quot; &gt; &lt;unsafe&gt;<\/title>/);
  assert.match(html, /name="parentName"/);
  assert.match(html, /canonical.*https:\/\/eeslern.com\//);
  assert.match(html, /\\u003cscript>/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /backend\.example/);
  assert.equal(calls, 1);
});
test("public edge reuses published snapshot within bounded cache; unavailable upstream is not a blank successful page", async () => {
  let calls = 0;
  let cached: Response | undefined;
  const cache = {
    match: async () => cached?.clone(),
    put: async (_request: RequestInfo | URL, response: Response) => {
      cached = response.clone();
    },
  };
  const send: typeof fetch = async () => {
    calls++;
    return Response.json({
      data: { content: defaultContent, version: 1, publishedAt: "2026-10-16" },
    });
  };
  await introductionResponse(
    new Request("https://eeslern.com/"),
    env,
    send,
    cache,
  );
  await introductionResponse(
    new Request("https://eeslern.com/"),
    env,
    send,
    cache,
  );
  assert.equal(calls, 1);
  assert.match(cached!.headers.get("cache-control")!, /max-age=30/);
  const failure = await introductionResponse(
    new Request("https://eeslern.com/"),
    env,
    async () => {
      throw new Error("private host");
    },
  );
  assert.equal(failure.status, 503);
  assert.doesNotMatch(await failure.text(), /private host/);
});
test("withdrawn/unpublished landing falls back to the unchanged static app; wrong routes are rejected", async () => {
  let calls = 0;
  const response = await introductionResponse(
    new Request("https://eeslern.com/"),
    env,
    async () => {
      calls++;
      return calls === 1
        ? new Response(null, { status: 404 })
        : new Response("static login");
    },
  );
  assert.equal(await response.text(), "static login");
  assert.equal(calls, 2);
  assert.equal(
    (await introductionResponse(new Request("https://wrong.example/"), env))
      .status,
    404,
  );
});

test("public media cache omits viewer credentials and bypasses Range requests", async () => {
  const { introductionAssetResponse } =
    await import("../infra/student-api-proxy/worker");
  let calls = 0;
  let cached: Response | undefined;
  const cache = {
    match: async () => cached?.clone(),
    put: async (_key: RequestInfo | URL, response: Response) => {
      cached = response.clone();
    },
  };
  const request = new Request(
    "https://eeslern.com/api/v1/introduction/media/00000000-0000-0000-0000-000000000001",
    { headers: { authorization: "private", cookie: "private" } },
  );
  const send: typeof fetch = async (input, init) => {
    calls++;
    const r = new Request(input, init);
    assert.equal(r.headers.get("authorization"), null);
    assert.equal(r.headers.get("cookie"), null);
    return new Response("image bytes", {
      headers: { "content-type": "image/jpeg" },
    });
  };
  assert.equal(
    await (await introductionAssetResponse(request, env, send, cache)).text(),
    "image bytes",
  );
  await introductionAssetResponse(request, env, send, cache);
  assert.equal(calls, 1);
  assert.match(cached!.headers.get("cache-control")!, /max-age=30/);
  await introductionAssetResponse(
    new Request(request, { headers: { range: "bytes=0-9" } }),
    env,
    async () => {
      calls++;
      return new Response("range", { status: 206 });
    },
    cache,
  );
  assert.equal(calls, 2);
});
