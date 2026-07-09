# Deployment Checklist

## 1. Backup and baseline safety first

Create a Supabase database backup/snapshot before applying migrations. Keep the currently deployed commit/tag available for code rollback.

The repository contains eleven migration files, but `20260704171621_remote_schema.sql` is only a migration-history placeholder and is not a recoverable baseline. Read `docs/DATABASE_BASELINE_SAFETY.md` before any reset, migration repair, database clone, or destructive cleanup.

## 2. Compare migration history before applying anything

Run read-only inspection first:

```bash
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

Review the output before any real push. Do not manually replay migrations that the remote history already considers applied.

Repository migration order:

1. `20260704171621_remote_schema.sql`
2. `20260704190000_bonplus_crm_finance_loyalty_upgrade.sql`
3. `20260705213000_finance_period_rollover_opening_entry.sql`
4. `20260705233000_feedback_workflow_stage.sql`
5. `20260705235900_discount_reminder_stages.sql`
6. `20260705235950_settings_feedback_whatsapp_center.sql`
7. `20260706002000_user_level_permissions.sql`
8. `20260706004000_completion_pack.sql`
9. `20260708130000_feedback_multiple_choice_options.sql`
10. `20260708233000_loyalty_coffee_food_rules.sql`
11. `20260708234500_feedback_question_archive_visibility.sql`

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

```bash
npm ci
npm run typecheck
npm run lint
npm run build:cf:next
npm run build:cf:bundle
npx wrangler deploy --dry-run
```

Keep the Next.js build and OpenNext bundle phases separate in Workers Builds.

## 6. Deploy to Cloudflare Workers

Use the same commit that passed preflight. Configure Workers Builds with:

- Build command: `npm run build:cf:next`
- Deploy command: `npm run build:cf:bundle && npm run cf:deploy`

See `docs/CLOUDFLARE_STAGE_2.md` for variables and secrets.

## 7. Post-deploy smoke check

Verify:

- login works and redirects to the first permitted page;
- Settings opens;
- logo can be uploaded;
- one user permission can be changed and saved;
- one WhatsApp template loads into its related action;
- one feedback row can move stage;
- one loyalty count can be recorded;
- finance pages load current-month data;
- costing page loads items and calculations;
- Activity Logs opens with today's Oman activity by default;
- Activity Logs date range, module filter, search, pagination, and detail modal work;
- `/admin/qa` is no longer part of the shipped application routes.

## 8. Historical data migration boundary

Do not migrate historical data and do not clean test data as part of this release. Those steps are deferred until the application is validated and the database baseline/backup process is verified.
