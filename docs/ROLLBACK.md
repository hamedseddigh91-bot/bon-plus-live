# Rollback Notes

## Code rollback

Rollback the application to the previous known-good Git commit/tag and redeploy it. Do not install an old patch ZIP on top of this cumulative release.

## Database rollback

The migrations add tables, columns, triggers, indexes, storage bucket configuration, and workflow behavior. Automatic destructive rollback SQL is intentionally not included because removing these objects could delete production data.

For a full rollback, restore the Supabase backup/snapshot taken before migration.

For a code-only rollback, the newly added database objects can remain in place because the older application normally ignores unknown tables and columns. Verify compatibility before relying on that approach.

## Integration rollback

Disable external review integrations in Settings and remove/rotate the cron and webhook secrets. This stops new review imports without deleting already imported feedback records.

## Permission emergency access

Owner and platform admin bypass user-level module permission rows. Use an owner account to repair accidental permission settings.
