# Deployment Checklist

## 1. Backup first

Create a Supabase database backup/snapshot before applying migrations. Keep the currently deployed commit/tag available for code rollback.

## 2. Apply migrations in this exact order

1. `20260704190000_bonplus_crm_finance_loyalty_upgrade.sql`
2. `20260705213000_finance_period_rollover_opening_entry.sql`
3. `20260705233000_feedback_workflow_stage.sql`
4. `20260705235900_discount_reminder_stages.sql`
5. `20260705235950_settings_feedback_whatsapp_center.sql`
6. `20260706002000_user_level_permissions.sql`
7. `20260706004000_completion_pack.sql`

Apply each migration once only. If the production database already has some of them, check migration history before running anything manually.

## 3. Environment variables

Copy `.env.example` into the deployment provider's environment settings and fill real values. Never commit real secrets.

Required for the main app:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required only for Google review sync:
- `GOOGLE_BUSINESS_CLIENT_ID`
- `GOOGLE_BUSINESS_CLIENT_SECRET`
- `GOOGLE_BUSINESS_REFRESH_TOKEN`

Optional temporary fallback:
- `GOOGLE_BUSINESS_ACCESS_TOKEN`

Required for integration routes:
- `INTEGRATIONS_CRON_SECRET`
- `TALABAT_REVIEWS_WEBHOOK_SECRET`

## 4. Cron / integration setup

Google review sync route:
- `POST /api/integrations/google-reviews/sync`
- Header: `x-cron-secret` with `INTEGRATIONS_CRON_SECRET`

Talabat review bridge webhook:
- `POST /api/integrations/talabat-reviews`
- Header: `x-webhook-secret` with `TALABAT_REVIEWS_WEBHOOK_SECRET`

Do not expose either secret in browser-side code.

## 5. Install and preflight

Run:
- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run build:cf:next`
- `npm run build:cf:bundle`
- `npx wrangler deploy --dry-run`

The Cloudflare build has been validated in this release. Keep the Next.js build and OpenNext bundle phases separate in Workers Builds.

## 6. Deploy to Cloudflare Workers

Use the same commit that passed preflight. Configure Workers Builds with:
- Build command: `npm run build:cf:next`
- Deploy command: `npm run build:cf:bundle && npm run cf:deploy`

See `docs/CLOUDFLARE_STAGE_2.md` for variables and secrets. After deployment, verify login and open the admin dashboard, Settings, CRM Feedback, Loyalty, Finance, Costing, and Action Center.

## 7. Post-deploy smoke check

Only a short smoke check is needed before general use:
- login works;
- Settings opens;
- logo can be uploaded;
- one user permission can be changed and saved;
- one WhatsApp template loads into its related action;
- one feedback row can move stage;
- one loyalty count can be recorded;
- finance pages load current-month data;
- costing page loads items and calculations.
