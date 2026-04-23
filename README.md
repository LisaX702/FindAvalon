# RelocateIt

Monorepo MVP for a relocation recommendation platform with authenticated user accounts.

## Included in the current scaffold

- `apps/web`: Next.js App Router app with auth, dashboard, preferences, results, saved places, and compare
- `apps/api`: NestJS API with cookie-session auth and user-scoped preference, favorites, compare, and recommendation endpoints
- `packages/types`: shared domain types and DTO-friendly interfaces
- `packages/constants`: category labels and onboarding defaults
- `packages/scoring`: explainable rules-based recommendation engine
- `packages/database`: Prisma schema, first migration, database client wrapper, and seed data

## Local setup

1. Copy `.env.example` to `.env`
2. Ensure PostgreSQL is running and `DATABASE_URL` points to your local database
3. Set `APP_URL` to your local web origin if you are not using `http://localhost:3000`
4. Install dependencies with `npm.cmd install`
5. Validate env setup with `npm.cmd run validate:env`
6. Apply the latest migrations with `npm.cmd run db:migrate`
7. Seed the database with `npm.cmd run db:seed`
8. Start the API with `npm.cmd run dev:api`
9. Start the web app with `npm.cmd run dev:web`
10. Open `http://localhost:3000/sign-up` to create an account, then continue through the app

## Environment templates

Use the templates based on where the app will run:

1. Local development: `.env.example`
2. Hosted deployment reference: `.env.production.example`

Local and hosted values are intentionally different:

1. Local `.env` uses localhost URLs and a local PostgreSQL connection string
2. Hosted web only needs the public `NEXT_PUBLIC_API_URL`
3. Hosted API uses the public `APP_URL`
4. Hosted `DATABASE_URL` and `PORT` should come from the platform, not from copied local values

## Deployment target

This repo is now prepared for a first deployment on Render using a Blueprint.

Why Render for this MVP:

1. It supports multi-service deployments from one repo
2. It can provision PostgreSQL alongside the app
3. A single `render.yaml` can describe web, API, and database together

Official docs used for this setup:

1. [Render Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
2. [Render Blueprints overview](https://render.com/docs/infrastructure-as-code)
3. [Render monorepo support](https://render.com/docs/monorepo-support)
4. [Render web services](https://render.com/docs/web-services)

## Fresh Windows machine setup

Prerequisites:

1. Node.js 24+
2. npm
3. PostgreSQL 16 running locally
4. A local database named `relocateit`

Recommended setup sequence:

1. Clone or copy the project to `C:\Users\lisag\Documents\Codex\2026-04-17-new-chat`
2. Create `.env` from `.env.example`
3. Confirm these values:
   - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/relocateit?schema=public"`
   - `NEXT_PUBLIC_API_URL="http://localhost:3001"`
   - `APP_URL="http://localhost:3000"`
   - `PORT="3001"`
4. Install dependencies with `npm.cmd install`
5. Generate Prisma artifacts with `npm.cmd run prisma:generate`
6. Validate env with `npm.cmd run validate:env`
7. Apply migrations with `npm.cmd run db:migrate`
8. Seed data with `npm.cmd run db:seed`
9. Start the API with `npm.cmd run dev:api`
10. Start the web app with `npm.cmd run dev:web`
11. Verify readiness with `npm.cmd run readiness:check`
12. Verify the core authenticated flow with `npm.cmd run qa:core`

## Render deployment setup

The repo now includes `render.yaml` at the root.

Render services defined:

1. `relocateit-web`
2. `relocateit-api`
3. `relocateit-db`

Before the first hosted rollout, use the checklist in `docs/render-rollout-checklist.md`.

Deployment flow on Render:

1. Create a new Blueprint in Render from this repository
2. Let Render provision the Postgres database from `render.yaml`
3. Provide the required public environment values when prompted:
   - `NEXT_PUBLIC_API_URL`
   - `APP_URL`
4. Deploy the Blueprint
5. After the first deploy, make sure:
   - `NEXT_PUBLIC_API_URL` matches the public Render URL of the API service
   - `APP_URL` matches the public Render URL of the web service

Render command mapping:

1. Web build: `npm run deploy:build:web`
2. Web start: `npm run deploy:start:web`
3. API build: `npm run deploy:build:api`
4. API start: `npm run deploy:start:api`
5. API pre-deploy migrate: `npm run deploy:migrate`

## Required deployment environment variables

Web service:

1. `NEXT_PUBLIC_API_URL`

API service:

1. `DATABASE_URL`
2. `APP_URL`
3. `PORT`

Notes:

1. Render provides `PORT` automatically for web services
2. `DATABASE_URL` is wired from the managed Postgres instance in `render.yaml`
3. `NEXT_PUBLIC_API_URL` and `APP_URL` must use public service URLs, not local URLs
4. `.env.production.example` is a reference template only; do not upload it directly as a runtime env file
5. Hosted auth defaults assume:
   - `HttpOnly`
   - `Path=/`
   - `Secure=true` for https deployments
   - `SameSite=None` for https deployments
6. Optional overrides exist for the API service if needed:
   - `SESSION_COOKIE_SECURE`
   - `SESSION_COOKIE_SAME_SITE`

## Render preflight and rollout order

Use this exact order for the first hosted rollout:

1. Confirm GitHub Actions CI is green
2. Confirm local readiness is green:
   - `npm.cmd run readiness:check`
   - `npm.cmd run qa:core`
3. Review `render.yaml`
4. Review `.env.production.example`
5. Follow `docs/render-rollout-checklist.md`
6. Deploy the Render Blueprint
7. Run hosted seed once after the first successful deploy
8. Verify sign-in, dashboard, preferences, results, saved places, compare, and detail in the hosted app

## Local deployment simulation

For Windows-friendly local simulation, use the env-aware root build plus the normal readiness path:

1. Build all workspaces with `npm.cmd run build`
2. Start the API with `npm.cmd run dev:api`
3. Start the web app with `npm.cmd run dev:web`
4. Verify with:
   - `npm.cmd run readiness:check`
   - `npm.cmd run qa:core`

If you want to test the exact Render build/start commands locally, first load the same environment values into your shell, then run:

1. `npm.cmd run deploy:build:web`
2. `npm.cmd run deploy:build:api`
3. `npm.cmd run deploy:start:api`
4. `npm.cmd run deploy:start:web`

## Recommended demo startup flow

Use this sequence when you want the app in a known-good local state:

1. `npm.cmd install`
2. `npm.cmd run prisma:generate`
3. `npm.cmd run validate:env`
4. `npm.cmd run db:migrate`
5. `npm.cmd run db:seed`
6. In one terminal: `npm.cmd run dev:api`
7. In a second terminal: `npm.cmd run dev:web`
8. In a third terminal: `npm.cmd run readiness:check`
9. In a fourth terminal: `npm.cmd run qa:core`

The default `dev:web` command now validates env, clears `apps/web/.next`, checks for a stale web listener, and starts a small programmatic Next.js dev server instead of the flaky Windows CLI path that was throwing `spawn EPERM` on this workstation. The web config also enables Next worker threads and the location detail route is forced dynamic in dev so Next is much less likely to fall back into the Windows-unfriendly child-process/static-path worker path during `qa:core`.

The web app now uses local/system font stacks instead of `next/font/google`, which removes the remaining Google Fonts network fetches from normal local dev and keeps startup quieter in restricted or offline-ish environments.

The default `dev:api` command now validates env, checks for a stale local listener on the configured API port, rebuilds the API workspace, and then runs the built server directly with Node. That avoids the flaky nested `npm run` chain that was intermittently failing on this Windows workstation.

## Regression / QA flow

Run `npm.cmd run qa:core` with both dev servers running. The script creates a fresh account and verifies:

1. sign up
2. authenticated session lookup
3. create preferences
4. edit preferences
5. load recommendations
6. save a place
7. add compare
8. remove compare
9. load dashboard
10. load results
11. load saved places
12. load compare
13. load detail page
14. sign out
15. sign back in

If the script finishes with `QA flow completed successfully.`, the main authenticated MVP flow is in good demo shape.

## CI validation

GitHub Actions now runs one lightweight monorepo workflow on every push and pull request.

It validates:

1. env/config sanity using the same validation script
2. Prisma client generation
3. migration apply and seed against a fresh Postgres 16 service
4. workspace typecheck
5. API build
6. web build
7. service startup
8. readiness check
9. authenticated end-to-end smoke flow through `qa:core`

CI is meant to catch deployment-readiness regressions before a hosted rollout. The recommended local demo path is still:

1. `npm.cmd run readiness:check`
2. `npm.cmd run qa:core`
3. manual browser spot-checking of the polished dashboard, results, detail, saved, and compare flows

## Hosted smoke verification

After a Render deploy, you can run a hosted smoke pass from any machine with Node:

1. Set:
   - `HOSTED_WEB_URL=https://<your-web-service>.onrender.com`
   - `HOSTED_API_URL=https://<your-api-service>.onrender.com`
2. Run `npm.cmd run qa:hosted`

What it verifies:

1. public web landing loads
2. public API health loads
3. disposable account sign-up works
4. authenticated session lookup works
5. preferences save works
6. recommendations load
7. save favorite works
8. compare add/remove works
9. dashboard, results, saved, compare, and detail pages are reachable in the authenticated flow
10. sign-out clears the session
11. sign-in restores the session

What still benefits from manual browser review:

1. final visual spot-checking of the hosted landing, sign-up, and sign-in pages
2. sign-in persists across real browser navigation and refresh
3. dashboard, results, saved, compare, and detail remain authenticated after full-page reloads
4. sign-out clears the session and pushes the browser back through the signed-out flow
5. final CTA/copy review on dashboard, results, compare, and detail

## Hosted troubleshooting

Use the API logs first. The API now logs concise request lines and failure lines with a failure class, for example `config`, `database`, `auth_session`, `cors_credentials`, or `application`.

Common hosted issues:

1. Symptom: `/api/health` is down or shows `database: error`
   - Likely cause: bad `DATABASE_URL`, unreachable Postgres, or migrations not applied
   - Where to check: API startup logs, `/api/health`, and Render database wiring
   - Quickest recovery: confirm the managed `DATABASE_URL`, rerun deploy with `deploy:migrate`, then rerun seed if needed
2. Symptom: sign-in/sign-up works inconsistently or protected pages fall back to signed-out state
   - Likely cause: cookie policy mismatch, wrong `APP_URL`, or browser credential issues between web and API origins
   - Where to check: API error logs with `auth_session` or `cors_credentials`, hosted smoke output, and browser network requests
   - Quickest recovery: confirm `APP_URL` is the public web origin, confirm `NEXT_PUBLIC_API_URL` is the public API origin, then rerun `npm.cmd run qa:hosted`
3. Symptom: browser calls localhost or the wrong API host
   - Likely cause: bad `NEXT_PUBLIC_API_URL`
   - Where to check: web env config and browser network tab
   - Quickest recovery: fix `NEXT_PUBLIC_API_URL`, redeploy the web service, and rerun the hosted smoke script
4. Symptom: requests return 401/403 unexpectedly after deploy
   - Likely cause: credentialed CORS mismatch or session cookie policy mismatch
   - Where to check: API logs for `origin=...` plus `auth_session` or `cors_credentials`, and the hosted smoke cookie-policy checks
   - Quickest recovery: verify `APP_URL`, hosted cookie defaults, and any `SESSION_COOKIE_*` overrides, then redeploy the API
5. Symptom: recommendations load but the app looks empty
   - Likely cause: hosted seed did not run or ran against the wrong database
   - Where to check: API health, readiness notes, and the location count from the hosted environment
   - Quickest recovery: run `npm run db:seed` against the hosted database, then rerun hosted smoke

## Environment validation

Run `npm.cmd run validate:env` any time you want a quick config check.

It fails clearly when any required value is missing or malformed:

1. `DATABASE_URL`
2. `APP_URL`
3. `NEXT_PUBLIC_API_URL`
4. `PORT` if you provide it

The web app now fails early if `NEXT_PUBLIC_API_URL` is missing, and the API now fails early if `DATABASE_URL` or `APP_URL` is missing.

## Readiness / health verification

Run `npm.cmd run readiness:check` with the API and web app running.

It verifies:

1. API reachable through `/api/health`
2. database reachable through Prisma
3. migration table present
4. seeded locations exist
5. web reachable through `/sign-in`

## Reseed locally

1. `npm.cmd run db:migrate`
2. `npm.cmd run db:seed`

## Known local issue and fastest recovery

The recurring Next.js dev issue on this workstation has had two main causes:
- stale `.next` output or port collisions during restarts
- Windows `spawn EPERM` inside Next's own CLI/static worker path

Mitigation now in place:

1. `npm.cmd run dev:web` clears the web `.next` cache before boot, checks the configured port, and uses the programmatic Next dev server path.
2. `npm.cmd run reset:web-cache` is available if you want to clear the cache manually without starting the app.

If you still hit a local dev chunk error:

1. Stop the web dev process
2. Run `npm.cmd run reset:web-cache`
3. Restart with `npm.cmd run dev:web`

If you want the fastest possible restart and are not seeing cache issues, you can use `npm.cmd run dev:web:raw`, but that raw path is the one most likely to reintroduce the Windows `spawn EPERM` issue.

## Common setup recovery steps

1. If env validation fails, compare `.env` to `.env.example` and rerun `npm.cmd run validate:env`
2. If Prisma commands fail, rerun `npm.cmd run prisma:generate`
3. If the DB is empty or stale, rerun:
   - `npm.cmd run db:migrate`
   - `npm.cmd run db:seed`
4. If the web app throws missing chunk errors, rerun:
   - `npm.cmd run reset:web-cache`
   - `npm.cmd run dev:web`
5. If local `dev:web` says the web port is already in use, run:
   - `npm.cmd run reset:web-port`
   - `npm.cmd run dev:web`
6. If you need the raw upstream Next CLI for debugging only, use:
   - `npm.cmd run dev:web:raw`
5. If a hosted deploy fails to reach the API from the browser, verify that:
   - `NEXT_PUBLIC_API_URL` points to the public API URL
   - `APP_URL` points to the public web URL
7. If hosted migrations fail, rerun the deploy after confirming the API service has access to the Render Postgres `DATABASE_URL`
8. If local `dev:api` says the API port is already in use, run:
   - `npm.cmd run reset:api-port`
   - `npm.cmd run dev:api`
9. If local API verification feels off, rerun:
   - `npm.cmd run readiness:check`
   - `npm.cmd run qa:core`

## What this slice adds

1. Prisma-backed users and sessions for email/password auth
2. Cookie-based sign-up, sign-in, sign-out, and authenticated user lookup
3. User-scoped preference profiles, favorites, compare sets, and recommendations
4. A dashboard home page and protected app routes driven by the active session
5. A multi-step preferences flow plus saved places, compare, and detail views tied to the signed-in account
