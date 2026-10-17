import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server.edge";
import { IntroductionView } from "../../src/features/introduction/view";
import {
  resolveContent,
  type IntroductionPage,
} from "../../src/features/introduction/models";
import type { ProxyEnvironment } from "./worker";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function introductionResponse(
  request: Request,
  env: ProxyEnvironment,
  send: typeof fetch = fetch,
  cache?: Pick<Cache, "match" | "put">,
): Promise<Response> {
  const incoming = new URL(request.url),
    publicOrigin = new URL(env.PUBLIC_ORIGIN).origin;
  if (
    incoming.origin !== publicOrigin ||
    incoming.pathname !== "/" ||
    !["GET", "HEAD"].includes(request.method)
  )
    return new Response("Not found", { status: 404 });
  const publicEndpoint = new URL(
    "/v1/introduction",
    new URL(env.API_ORIGIN).origin,
  );
  const cacheKey = new Request(`${publicOrigin}/__published-introduction`);
  const cached = await cache?.match(cacheKey);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("cache-control", "public,max-age=0,must-revalidate");
    return new Response(request.method === "HEAD" ? null : cached.body, {
      status: cached.status,
      headers,
    });
  }
  let response: Response;
  try {
    response = await send(publicEndpoint, {
      headers: { accept: "application/json" },
      redirect: "error",
    });
  } catch {
    return new Response("Trang đang tạm gián đoạn. Vui lòng thử lại.", {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
  if (response.status === 404) return send(request);
  if (!response.ok)
    return new Response("Trang đang tạm gián đoạn. Vui lòng thử lại.", {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  const payload = (await response.json()) as { data: IntroductionPage };
  if (!payload.data?.content?.texts)
    return new Response("Trang chưa sẵn sàng.", { status: 503 });
  const content = resolveContent(payload.data.content),
    assetsBase = "";
  const manifest =
    "/api/v1/portal/manifest.webmanifest?" +
    new URLSearchParams({
      portal: "student",
      origin: publicOrigin,
      basePath: "",
    });
  const icon = "/api/v1/portal/icon.png?portal=student&size=192";
  const title = content.texts.metaTitle,
    description = content.texts.metaDescription;
  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public,max-age=0,must-revalidate",
    "x-content-type-options": "nosniff",
    "content-security-policy":
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    "referrer-policy": "strict-origin-when-cross-origin",
  };
  if (request.method === "HEAD") return new Response(null, { headers });
  const stream = await renderToReadableStream(
    createElement(IntroductionView, { content, assetsBase }),
  );
  await stream.allReady;
  const markup = await new Response(stream).text();
  const data = JSON.stringify({ content, assetsBase })
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const documentResponse = new Response(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(publicOrigin)}/"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${escape(publicOrigin)}/"><link rel="manifest" href="${escape(manifest)}"><link rel="apple-touch-icon" href="${escape(icon)}"><link rel="icon" href="${escape(icon)}"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="stylesheet" href="/introduction-fonts.css"><link rel="stylesheet" href="/introduction.css"></head><body class="intro-public-body"><div id="ees-introduction-root">${markup}</div><script type="application/json" id="ees-introduction-data">${data}</script><script type="module" src="/introduction/client.js"></script></body></html>`,
    { headers },
  );
  if (cache) {
    const headers = new Headers(documentResponse.headers);
    headers.set("cache-control", "public,max-age=30");
    await cache.put(
      cacheKey,
      new Response(documentResponse.clone().body, { headers }),
    );
  }
  return documentResponse;
}
