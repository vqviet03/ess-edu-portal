# Public introduction / SEO deployment

Figma: `iZebknoIUHNK3AbmeYCb0R`, desktop `3:321`, mobile `3:487`, success dialog `4:314`, privacy dialog `4:509`. The original classroom JPEG and plane SVG are committed in `public/introduction/`. Only these design assets/default editable copy are supplied; there are no mock API responses in runtime.

`src/features/introduction/view.tsx`, `models.ts`, `fonts.css`, and `public/introduction.css` are mirrored in Staff to keep the manager preview and public layout identical. CSS and the EESIntroduction font alias are scoped; existing app layout/theme/fonts are preserved. The manager editor has a separate authorization boundary and is never bundled into the guest page.

The main app still uses Next.js static export/GitHub Pages. `npm run build` first generates the small guest hydration entry and local font files, then runs the existing Next build. The root proxy renders the same React view to actual HTML, with title, description, canonical URL and form, using only the BE's published snapshot. Hydration uses a guest-only RTK Query store, without JWT/auth bootstrap/socket/polling. Standard authenticated pages and their proxy remain unchanged. Before first publication/after withdrawal, the static root keeps the original authenticated-home/guest-login navigation.

## Review/deployment order (operator action, not automatically executed by this PR)

1. Merge/release BE into `main`, apply Core migration `026_introduction.sql` using the existing migration job. No new Neon/storage resource or secret; live Neon stays on branch `production`.
2. Release Staff and Student PRs into `dev` using the existing workflows. This generates/publishes `/introduction/client.js`, CSS, fonts and design assets with the static site.
3. Redeploy the **existing** Cloudflare worker, adding the exact root route alongside `/api/*` (already in wrangler.toml). Run from a checkout of this repo:

```bash
npm ci
npm run build
cd infra/student-api-proxy
npx wrangler deploy --dry-run
npx wrangler deploy
```

Use the same operator Cloudflare account/zone as the current proxy. No Cloud Run secret, VAPID key or new service account is needed. This development task does not run the real deploy command.

Existing vars (unchanged):

```toml
API_ORIGIN = "https://ess-edu-api-920149468670.asia-southeast1.run.app"
PUBLIC_ORIGIN = "https://eeslern.com"
```

Routes:

```toml
{ pattern = "eeslern.com/", zone_name = "eeslern.com" }
{ pattern = "eeslern.com/api/*", zone_name = "eeslern.com" }
```

4. In Staff, open **Trang giới thiệu**, edit/save draft, then explicitly **Công bố**. Draft changes are private until the next publication.
5. Check `view-source:https://eeslern.com/`: published heading/content and SEO metadata must appear before JavaScript. Test registration and the manager's registration list. Test `/login/`, existing file APIs and WebSocket connection as before.

## Cache and privacy

Only anonymous, published introduction HTML/media are eligible for a 30-second edge cache. It is demand-driven; there is no refresh timer/job or DB activity while idle. Publication/withdrawal can take at most 30 seconds to appear at each edge. Range responses bypass media caching. Credentials are not forwarded for guest HTML fetches or cached media fetches; private API/file/auth/socket responses stay no-store. Public media API exposes only explicitly selected common-library images/PDFs in the published snapshot, never storage keys or secrets.

Registration uses the real API with consent, validation and UUID idempotency. Browser double clicks share an in-flight guard, and server uniqueness prevents repeated inquiries after a network retry. A saved lead does not create an account/enrollment. Limits and pagination are documented in the backend PR.

## Verification

Run format/lint/typecheck/unit tests/build and browser tests. `tests/introduction.test.ts` verifies semantic SSR, HTML escaping, bounded cache, missing/unpublished content and guest credential isolation. `tests/introduction.spec.ts` covers desktop/mobile, light/dark, navigation and registration. The worker can be fully bundled without credentials using `wrangler deploy --dry-run`.
