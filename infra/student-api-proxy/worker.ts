import { introductionResponse } from "./introduction";
export interface ProxyEnvironment {
  API_ORIGIN: string;
  PUBLIC_ORIGIN: string;
}

function publicUrl(value: string, upstream: string, publicOrigin: string) {
  return value.startsWith(upstream + "/v1/") || value === upstream + "/v1"
    ? publicOrigin + "/api" + value.slice(upstream.length)
    : value;
}

function publicLinks(
  value: unknown,
  upstream: string,
  publicOrigin: string,
): unknown {
  if (typeof value === "string")
    return publicUrl(value, upstream, publicOrigin);
  if (Array.isArray(value))
    return value.map((item) => publicLinks(item, upstream, publicOrigin));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        publicLinks(item, upstream, publicOrigin),
      ]),
    );
  return value;
}

// Runs at the edge, never in GitHub Pages or in the browser. No timers or caching.
export async function proxyRequest(
  request: Request,
  env: ProxyEnvironment,
  send: typeof fetch = fetch,
): Promise<Response> {
  const incoming = new URL(request.url);
  const upstream = new URL(env.API_ORIGIN).origin;
  const publicOrigin = new URL(env.PUBLIC_ORIGIN).origin;
  if (!upstream.startsWith("https://") || !publicOrigin.startsWith("https://"))
    return new Response("Invalid proxy configuration", { status: 503 });
  if (
    incoming.origin !== publicOrigin ||
    !/^\/api\/v1(?:\/|$)/.test(incoming.pathname)
  )
    return new Response("Not found", { status: 404 });
  const target = new URL(
    incoming.pathname.slice(4) + incoming.search,
    upstream,
  );
  if (target.origin !== upstream || !/^\/v1(?:\/|$)/.test(target.pathname))
    return new Response("Not found", { status: 404 });
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", "https");
  try {
    const response = await send(new Request(target, request), {
      headers,
      redirect: "manual",
    });
    // Cloudflare forwards the upgrade and both WebSocket directions itself.
    if (response.status === 101) return response;
    const outgoing = new Headers(response.headers);
    outgoing.set("cache-control", "no-store");
    outgoing.delete("server");
    outgoing.delete("x-powered-by");
    const location = outgoing.get("location");
    if (location)
      outgoing.set("location", publicUrl(location, upstream, publicOrigin));
    const type = outgoing.get("content-type") ?? "";
    if (
      request.method !== "HEAD" &&
      response.body !== null &&
      /application\/(?:[\w.-]+\+)?json\b/i.test(type)
    ) {
      const body: unknown = await response.json();
      outgoing.delete("content-length");
      outgoing.delete("content-encoding");
      outgoing.delete("etag");
      return new Response(
        JSON.stringify(publicLinks(body, upstream, publicOrigin)),
        { status: response.status, headers: outgoing },
      );
    }
    return new Response(response.body, {
      status: response.status,
      headers: outgoing,
    });
  } catch {
    // Never expose upstream URL, credentials, signed URLs or private payloads.
    return Response.json(
      {
        error: {
          code: "PROXY_UNAVAILABLE",
          message: "Không kết nối được API. Vui lòng thử lại.",
        },
      },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

// Cache only media explicitly exposed by the published introduction. Private file/auth/socket routes remain no-store.
export async function introductionAssetResponse(
  request: Request,
  env: ProxyEnvironment,
  send: typeof fetch = fetch,
  cache?: Pick<Cache, "match" | "put">,
): Promise<Response> {
  if (request.headers.has("range") || request.method !== "GET")
    return proxyRequest(request, env, send);
  const cached = await cache?.match(request);
  if (cached) return cached;
  const headers = new Headers(request.headers);
  headers.delete("authorization");
  headers.delete("cookie");
  const response = await proxyRequest(
    new Request(request, { headers }),
    env,
    send,
  );
  if (response.status !== 200) return response;
  const outgoing = new Headers(response.headers);
  outgoing.set("cache-control", "public,max-age=30");
  const result = new Response(response.body, {
    status: 200,
    headers: outgoing,
  });
  if (cache) await cache.put(request, result.clone());
  return result;
}
const worker = {
  fetch: (request: Request, env: ProxyEnvironment) => {
    const cache = (
      globalThis.caches as (CacheStorage & { default?: Cache }) | undefined
    )?.default;
    const path = new URL(request.url).pathname;
    if (path === "/") return introductionResponse(request, env, fetch, cache);
    if (/^\/api\/v1\/introduction\/media\/[a-fA-F0-9-]{36}$/.test(path))
      return introductionAssetResponse(request, env, fetch, cache);
    return proxyRequest(request, env);
  },
};
export default worker;
