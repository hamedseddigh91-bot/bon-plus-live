# Database Baseline Safety

## Current repository state

The application depends on database objects that are not fully defined by the migration files currently stored in this repository. The file `20260704171621_remote_schema.sql` is intentionally marked as a migration-history placeholder and is not a recoverable baseline.

This means the current production database must be treated as the source of truth until a verified schema capture is committed and tested.

## Rules before any destructive database work

Do not run database reset, migration repair, schema recreation, or data cleanup until all of the following are complete:

- a fresh database backup exists;
- local and remote migration histories have been compared;
- the current remote schema has been captured;
- database functions/RPCs, triggers, RLS policies, grants, extensions, storage configuration, and other required objects have been verified;
- the captured baseline has been restored and smoke-tested in a disposable environment.

## Safe read-only inspection sequence

Use the linked project only for inspection first:

```bash
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

Do not proceed with a real `db push`, migration repair, or reset until the output is reviewed and the baseline has been captured.

## Baseline capture target

The repository should ultimately contain enough versioned SQL to recreate the required application database objects from scratch. A proper capture must include more than table definitions; it must account for the RPCs used by the application, triggers, RLS policies, grants, and required extensions.

After the capture is produced, validate it by creating a disposable Supabase/Postgres environment and running the application smoke tests against that environment.

## Data migration boundary

Historical-data migration and test-data cleanup are deliberately out of scope for the current release work. They should happen only after application validation, backup verification, and baseline recovery work are complete.
