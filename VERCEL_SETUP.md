# FPL Analyzer: Vercel setup

## How it is hosted

Everything runs on Vercel:

- **Static pages**: `*.html`, `*.js`, `*.css` and `data/*.json` are served as they are. There is no framework and no build step; `vercel.json` sets the output directory to the repository root.
- **`api/proxy.js`** (`/api/proxy?url=...`) fetches from `https://fantasy.premierleague.com/api/...` and returns the JSON. The FPL API sends no CORS headers, so browsers can't call it directly. Pages and proxy share one origin, so the browser calls `/api/proxy` with a relative URL.
- **`api/rank.js`** (`/api/rank`) builds the sample used for the live overall rank estimate. It is CDN-cached for 10 minutes (`s-maxage=600`), so FPL sees at most one build per 10 minutes for all visitors.

```
Browser ── /*.html, /data/*.json ──▶ Vercel (static)
Browser ── /api/proxy?url=... ─────▶ Vercel function ──▶ FPL API
Browser ── /api/rank ──────────────▶ Vercel function ──▶ FPL API
```

Proxy responses are cached in the browser and on Vercel's CDN for 5 minutes (`max-age` / `s-maxage` = 300 s). Live gameweek data (`/api/event/<n>/live/` and `/api/fixtures/?event=<n>`) is cached for 60 s. `vercel.json` sets function timeouts of 30 s for the proxy and 60 s for the rank sample.

## Deploys

- The Vercel project is connected to `github.com/skojic/fpl-analyzer` through Vercel's Git integration. **Every push to `main` deploys to production**; other branches get preview deployments.
- The daily data job commits refreshed `data/*.json` to `main` only when something changed, which triggers a redeploy.
- **Production domain: https://fpl-analyzer-eosin.vercel.app**. Always share this one. Per-deployment URLs (`fpl-analyzer-<hash>-<team>.vercel.app`) point to a single deployment and return `410 GONE` once Vercel removes it.
- **Deployment Protection**: Project → Settings → Deployment Protection. With Vercel Authentication on for production, visitors get a 302 redirect to a Vercel login page instead of the app. Keep production public (protect preview deployments only if you like), and check the production domain in a private window after changing it.

## GitHub Actions settings

The daily job (`.github/workflows/data.yml`) and the manual odds check (`.github/workflows/odds-check.yml`) run on GitHub, not on Vercel.

- **`ODDS_API_KEY`** secret: add it under the repository's Settings → Secrets and variables → Actions → New repository secret. Only the GitHub jobs use it (`scripts/build-odds.js`, `scripts/check-odds-markets.js`). Without it, the odds step is skipped and the rest of the job still runs. The key is never needed on Vercel or in the browser.
- **`FPL_PROXY`** is set in `data.yml` to `https://fpl-analyzer-eosin.vercel.app/api/proxy?url=`. The scripts call the FPL API directly and retry through this proxy only if FPL refuses requests from GitHub's servers.

## Local development

```bash
npx vercel dev     # serves the pages, /api/proxy and /api/rank on http://localhost:3000
npm test           # checks the client, model and proxy against the live FPL API
```

The first `npx vercel dev` asks you to log in and link the folder to the project. Opening `index.html` from disk (`file://`) won't load data, because `/api/proxy` doesn't exist there.

## Verify

```bash
curl -i "https://fpl-analyzer-eosin.vercel.app/api/proxy?url=https%3A%2F%2Ffantasy.premierleague.com%2Fapi%2Fbootstrap-static%2F"
curl -i "https://fpl-analyzer-eosin.vercel.app/api/rank"
```

Both should return `HTTP 200` with `content-type: application/json` and a `cache-control` header.

## Troubleshooting

| Result | Cause |
|---|---|
| `302` to `vercel.com/sso-api` | Deployment Protection is on for production |
| `410 GONE` | A per-deployment URL that was removed; use the production domain |
| `404` on `/api/...` | Function not deployed; check the deployment's Functions tab |
| `400 Only FPL API requests allowed` | `url` must be `https://fantasy.premierleague.com/api/...` |
| `405 Method not allowed` | Only `GET` is accepted |
| `502` from `/api/rank` | Building the sample failed (FPL unavailable or mid-update); retry later |
| Odds missing on the site | `ODDS_API_KEY` secret not set or out of credits; see the "Data refresh" run log. Odds older than 4 days are ignored |
| Data not updating | Check the "Data refresh" workflow under Actions; it commits only when `data/` changes |

## Cost

Free: the Vercel Hobby plan for hosting and functions (CDN caching keeps invocations low), GitHub Actions for the public repository, and about 60 of The Odds API's 500 free monthly credits.

## Security notes

- The proxy forwards only `GET` requests to `https://fantasy.premierleague.com/api/...` (exact hostname and path check) and returns 400 for anything else.
- It sends no CORS headers, so other websites can't call it from their pages.
- Requests are logged in the Vercel dashboard; nothing is stored.
