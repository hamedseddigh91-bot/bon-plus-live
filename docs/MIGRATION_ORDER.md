# Migration Order

The release contains seven application migrations and they must remain ordered by filename.

- `20260704190000_bonplus_crm_finance_loyalty_upgrade.sql`
- `20260705213000_finance_period_rollover_opening_entry.sql`
- `20260705233000_feedback_workflow_stage.sql`
- `20260705235900_discount_reminder_stages.sql`
- `20260705235950_settings_feedback_whatsapp_center.sql`
- `20260706002000_user_level_permissions.sql`
- `20260706004000_completion_pack.sql`

After all migrations are applied to the actual Supabase project, regenerate TypeScript database types from that live schema if you later decide to introduce typed Supabase clients. The current application does not import a generated `Database` type, so no fabricated type file is included in this release.
