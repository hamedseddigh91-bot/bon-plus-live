# Migration Order

The repository currently contains eleven migration files. Keep them ordered by filename and do not run them manually as a blind batch against production.

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

## Baseline warning

`20260704171621_remote_schema.sql` is a migration-history placeholder, not a complete schema backup. It must not be treated as sufficient to recreate a new Supabase project.

Before a database reset, migration repair, clone, or disaster-recovery exercise:

1. verify linked local/remote migration history;
2. capture the actual remote schema and database backup;
3. preserve policies, triggers, functions, extensions, storage configuration, and auth-related dependencies;
4. validate the captured baseline in a disposable environment before relying on it.

See `docs/DATABASE_BASELINE_SAFETY.md`.
