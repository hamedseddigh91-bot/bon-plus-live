# Bon Plus — QR Feedback Visibility Update

This update restores the existing QR Feedback feature instead of rebuilding it.

Changes:
- `/admin/qr` now redirects to `/admin/settings/qr`
- Adds a real Settings > QR Feedback page
- Reuses the existing `PublicQrManager`
- Removes the nested client AdminShell wrapper from the QR manager
- Adds QR Feedback to Settings navigation
- Keeps the feature under the existing `settings_feedback` navigation permission

No Supabase migration, table, column, policy, storage bucket, RPC, or environment variable change is included.
