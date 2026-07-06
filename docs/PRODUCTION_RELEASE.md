# Bon Plus — Production Release Pack

This folder is a cumulative release of the Bon Plus web app. It already includes the previous CRM, Feedback, Follow-up, Discounts, Loyalty, Finance, Costing, Settings, WhatsApp template center, Action Center, user-level permissions, logo upload, and external-review integration work.

## Final hardening added in this release

- User-level View/Edit permissions are enforced on protected server actions in the active CRM, Follow-up, Discount, Loyalty, Finance, Costing, Settings, Users, Reports, Activity Logs, and Action Center flows.
- Permission changes require `settings_users` edit access and are written to `activity_logs`.
- Owner and platform admin keep bypass access.
- Business listing no longer falls back to an unauthenticated all-business list.
- Finance and Follow-up WhatsApp actions use the current UI language when loading centralized templates.
- The Loyalty reward action handler was renamed to avoid React hook-rule ambiguity.
- A production preflight command was added: `npm run check`.
- Temporary runtime artifacts and local secrets are excluded from the release.

## Verified in the release workspace

- `npm run typecheck` passes.
- `npm run lint` exits successfully; warnings remain but there are no lint errors.
- `npm run build` could not complete in the packaging environment because Next.js attempted to download the native SWC package and the environment blocks npm registry access. This is an environment limitation, not a TypeScript or ESLint failure. Run the build once on the deployment machine or CI environment with normal npm registry access.

## Release rule

Do not copy old patch ZIPs over this release. Treat this pack as the new project baseline.
