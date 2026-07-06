# Release Manifest

Release date: 2026-07-06

- Source files: 133
- Supabase migrations: 7
- Validation: TypeScript passed
- Validation: ESLint passed with warnings only and zero errors
- Full Next.js build: not completed in packaging sandbox because the native SWC package could not be downloaded from the blocked npm registry

## Cumulative feature baseline

- CRM: Feedback, Follow-ups, Customers, Discounts, Loyalty
- Feedback workflow: New, In Follow-up, Resolved
- Configurable feedback response rules and Google review request settings
- Central WhatsApp template center
- Action Center aggregation
- Finance: cash closing, invoices, petty cash/cash view, monthly periods and rollover
- Costing: raw ingredients, prep items, menu items, recipes, cost/profit/sale-price/multiple reporting
- Settings: General, Feedback, Users, Loyalty Rules, WhatsApp Messages, External Reviews
- Per-user View/Edit permissions with server-action enforcement on active modules
- Logo upload through Supabase Storage
- Google review sync route and Talabat review bridge webhook
