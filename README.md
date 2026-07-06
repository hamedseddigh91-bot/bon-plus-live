# Bon Plus

Bon Plus is a Next.js business operations and customer experience platform backed by Supabase.

## Local development

1. Install dependencies with `npm ci`.
2. Create `.env.local` from `.env.example` and fill the required values.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

## Quality checks

- `npm run typecheck`
- `npm run lint`
- `npm run check`

## Cloudflare Workers target

The production target is Cloudflare Workers through OpenNext.

Use the exact setup in:

`docs/CLOUDFLARE_STAGE_2.md`

The Cloudflare deployment pipeline is split into two phases:

- Build command: `npm run build:cf:next`
- Deploy command: `npm run build:cf:bundle && npm run cf:deploy`

## Supabase

Apply production migrations only in the order documented in:

`docs/MIGRATION_ORDER.md`

Never commit `.env.local`, `.dev.vars`, service role keys, OAuth secrets, or integration secrets.
