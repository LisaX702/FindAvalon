# Render rollout checklist

Use this checklist for the first hosted rollout of RelocateIt.

## 1. Preflight

1. Confirm the latest GitHub Actions CI run is green.
2. Confirm local readiness still passes:
   - `npm.cmd run readiness:check`
   - `npm.cmd run qa:core`
3. Confirm `render.yaml` is committed and matches the intended services:
   - `relocateit-web`
   - `relocateit-api`
   - `relocateit-db`
4. Review `.env.production.example` so the public URLs are ready before deployment.

## 2. Render service setup

1. Create a new Blueprint from this repository.
2. Let Render provision:
   - one web service for `relocateit-web`
   - one web service for `relocateit-api`
   - one Postgres database for `relocateit-db`
3. Set the public environment values:
   - web: `NEXT_PUBLIC_API_URL=https://<your-api-service>.onrender.com`
   - api: `APP_URL=https://<your-web-service>.onrender.com`
4. Do not manually copy a local `DATABASE_URL` into Render if the managed database is already wired from `render.yaml`.

## 3. Deploy order

1. Trigger the Blueprint deploy.
2. Let the API pre-deploy command run migrations:
   - `npm run deploy:migrate`
3. Seed the hosted database after the first successful deploy:
   - open a Render shell or one-off job for the API service
   - run `npm run db:seed`
4. Wait for both web and API services to report healthy.

## 4. Post-deploy verification

1. Open the deployed sign-in page.
2. Create a fresh account or sign in with a known account.
3. Run the hosted smoke script:
   - set `HOSTED_WEB_URL=https://<your-web-service>.onrender.com`
   - set `HOSTED_API_URL=https://<your-api-service>.onrender.com`
   - run `npm.cmd run qa:hosted`
4. Verify:
   - dashboard loads
   - preferences save
   - results load
   - saved places works
   - compare works
   - location detail loads
5. Confirm the browser is calling the public API URL, not localhost.
6. Do one quick manual browser auth pass:
   - sign in and refresh the dashboard
   - open results, saved, compare, and detail in normal navigation
   - fully reload one protected page
   - sign out and confirm the signed-out flow returns cleanly

## 5. Common rollout issues

1. Missing env vars:
   - web build fails or browser calls localhost
   - fix `NEXT_PUBLIC_API_URL`
2. Web/API URL mismatch:
   - sign-in works inconsistently or cookie/session flow breaks
   - fix `APP_URL` on the API service and confirm it matches the public web URL
3. DB connection issues:
   - API health fails or Prisma cannot start
   - confirm the API service has the managed `DATABASE_URL`
4. Migration issues:
   - app boots against an outdated schema
   - rerun the deploy after confirming `deploy:migrate` is enabled
5. Seed issues:
   - the app loads but recommendation data is empty
   - run `npm run db:seed` against the hosted database

## 6. Troubleshooting during rollout

Use the API logs first. The hosted API now emits one concise request line per non-trivial request and one concise error line with a failure class.

Quick guide:

1. Symptom: startup fails before the API is reachable
   - Likely cause: config or database boot issue
   - Where to check: Render API logs for `API bootstrap failed class=config` or `class=database`
   - Quickest recovery: confirm `APP_URL`, `DATABASE_URL`, and database availability, then redeploy
2. Symptom: `/api/health` fails or returns `database: error`
   - Likely cause: database connectivity or migration issue
   - Where to check: API logs and Render Postgres wiring
   - Quickest recovery: rerun deploy, confirm `deploy:migrate`, then rerun seed if needed
3. Symptom: auth looks flaky across the hosted web and API
   - Likely cause: web/API URL mismatch or cookie/CORS mismatch
   - Where to check: API error lines tagged `auth_session` or `cors_credentials`, plus the hosted smoke output
   - Quickest recovery: verify `APP_URL`, `NEXT_PUBLIC_API_URL`, and rerun `npm.cmd run qa:hosted`
4. Symptom: hosted smoke passes health but the UI looks empty
   - Likely cause: seed missing or wrong database target
   - Where to check: hosted smoke output, API health, and API logs
   - Quickest recovery: run `npm run db:seed` against the hosted database
