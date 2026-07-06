# Cloudflare Stage 2 — Bon Plus

Bon Plus is configured for Cloudflare Workers with OpenNext.

## What is already prepared

- Next.js standalone output enabled
- `@opennextjs/cloudflare` installed
- Wrangler installed
- `wrangler.jsonc` added
- `open-next.config.ts` added
- immutable cache headers for `/_next/static/*`
- `.open-next`, `.wrangler`, and local Cloudflare secret files ignored by Git
- Cloudflare environment type generation configured
- external Google font fetching removed from the production build path

## Cloudflare Workers Builds settings

When connecting the GitHub repository in Cloudflare, use two separate phases:

Build command:

`npm run build:cf:next`

Deploy command:

`npm run build:cf:bundle && npm run cf:deploy`

The build phase creates the standalone Next.js output. The deploy phase converts that output to OpenNext/Workers format and deploys it.

## Required Build Variables

Add these to Workers Builds because Next.js may need them during build:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Required Worker Secrets

Add sensitive values as Cloudflare secrets, not plaintext variables in Git:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_BUSINESS_CLIENT_ID`
- `GOOGLE_BUSINESS_CLIENT_SECRET`
- `GOOGLE_BUSINESS_REFRESH_TOKEN`
- `GOOGLE_BUSINESS_ACCESS_TOKEN` (optional fallback)
- `INTEGRATIONS_CRON_SECRET`
- `TALABAT_REVIEWS_WEBHOOK_SECRET`

The public variables also need to be available to the deployed Worker runtime.

## Local / CI validation sequence

Run these as separate commands:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build:cf:next`
4. `npm run build:cf:bundle`
5. `npx wrangler deploy --dry-run`

After steps 3 and 4, local Workers runtime preview is available with:

`npm run cf:preview`

## Current validation status

- TypeScript: passed
- ESLint: 0 errors, 14 warnings
- Next.js production standalone build: passed
- OpenNext Workers bundle: passed
- Wrangler dry-run bundle size: about 1.9 MiB gzip
- Cloudflare Workers Free compressed Worker size limit: 3 MiB
- Local Workers runtime smoke test: `/login` returned HTTP 200
