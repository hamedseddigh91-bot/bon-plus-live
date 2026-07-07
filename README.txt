BON PLUS — FEEDBACK CENTER UPDATE

What this update does:
- Replaces the separate Feedback Questions, Response Rules, and External Reviews tabs in Settings with one top-level Feedback tab.
- Adds a Feedback Center landing page.
- Adds nested Feedback pages:
  /admin/settings/feedback/questions
  /admin/settings/feedback/response-rules
  /admin/settings/feedback/external-reviews
  /admin/settings/feedback/qr
- Restores QR Feedback inside the Feedback Center.
- Keeps old URLs working via redirects.
- Does not require Supabase migrations, tables, columns, policies, storage, functions, or new environment variables.

Install:
1) Extract this folder directly inside the project root.
2) Run:
   powershell -ExecutionPolicy Bypass -File .\bon-plus-feedback-center-update\apply-feedback-center.ps1
3) Run:
   npm run build
4) If build succeeds:
   git add .
   git commit -m "unify feedback settings center"
   git push origin main
