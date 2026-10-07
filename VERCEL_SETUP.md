# FPL Analyzer - Vercel Setup Guide

## How it works
The FPL API doesn't send CORS headers, so browsers can't call it directly. The whole app is hosted on Vercel:

- The static pages (`index.html`, `*.js`, `styles.css`, ...) are served as-is.
- `api/proxy.js` is a serverless function at `/api/proxy?url=...` that fetches from `fantasy.premierleague.com/api/` and returns the JSON.

Pages and proxy share one origin, so the browser calls `/api/proxy` as a relative URL. No CORS and no hardcoded proxy domain.

```
Browser ── /index.html ───────────────▶ Vercel (static)
Browser ── /api/proxy?url=... ────────▶ Vercel function ──▶ FPL API
```

Responses are cached for 5 minutes in the browser and on Vercel's CDN (`s-maxage`), so most repeat requests skip the function.

## Deploy

1. **Import the repository** at https://vercel.com/new (or run `npx vercel` in the project folder). No framework, no build command: `vercel.json` already sets the output directory to the repo root.
2. **Deploy to production**: pushes to `main` deploy automatically, or run `npx vercel --prod`.
3. **Make the production site public**: Project → Settings → Deployment Protection. With Vercel Authentication on, visitors get a 302 to a Vercel login page instead of the app. Turn it off, or set it to protect preview deployments only. Either way, check the production domain in a private window.

## Which URL to use
Always share the project's **production domain** (Project → Settings → Domains, e.g. `fpl-analyzer-<team>.vercel.app` or a custom domain).

Do **not** use per-deployment URLs like `fpl-analyzer-82wvbp663-<team>.vercel.app`. Each one points at one deployment, and Vercel deletes old deployments. That URL then returns `410 GONE`, which is why the app stopped loading data before.

## Verify
```bash
curl -i "https://<production-domain>/api/proxy?url=https%3A%2F%2Ffantasy.premierleague.com%2Fapi%2Fbootstrap-static%2F"
```
Expected: `HTTP 200` with `content-type: application/json`.

| Result | Cause |
|---|---|
| `302` to `vercel.com/sso-api` | Deployment Protection is on (step 3) |
| `410 GONE` | Per-deployment URL that was removed; use the production domain |
| `404` | Function not deployed; check the deployment's Functions tab |
| `400 Only FPL API requests allowed` | `url` must be `https://fantasy.premierleague.com/api/...` |

## Local development
```bash
npx vercel dev     # serves the pages and /api/proxy on http://localhost:3000
npm test           # checks fpl-api.js and api/proxy.js against the live FPL API
```
Opening `index.html` from disk (`file://`) won't load data, because `/api/proxy` doesn't exist there.

## Cost
Free on the Hobby plan. CDN caching keeps function invocations low.

## Security notes
- The proxy only forwards `GET` requests to `https://fantasy.premierleague.com/api/...` (exact hostname check) and returns 400 for anything else.
- It sends no CORS headers, so other websites can't call it from their pages.
- Requests are logged in the Vercel dashboard; nothing is stored.
