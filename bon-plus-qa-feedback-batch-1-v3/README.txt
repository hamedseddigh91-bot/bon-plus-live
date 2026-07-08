Bon Plus QA Feedback/CRM Batch 1

This package applies the first implementation batch from the QA checklist:
- Feedback workflow tabs: New / Follow-up / Resolved
- Compact stage selector and workflow consistency fix
- Loyalty counting types: Coffee / Food
- Multiple Choice public rendering/data hydration fix
- Feedback question safe edit versioning
- Delete/Archive behavior for feedback questions
- Thank You Only reward suppression and cleanup
- Public Feedback layout and lightweight loading screen

Supabase change required:
- Run the migration copied to:
  supabase/migrations/20260708233000_loyalty_coffee_food_rules.sql

Apply:
1) Extract this folder inside cafe-retention-app project root.
2) Run:
   powershell -ExecutionPolicy Bypass -File .\bon-plus-qa-feedback-batch-1-v3\apply-qa-feedback-batch-1.ps1
3) Run the new Supabase migration.
4) Run:
   npm run build
5) Test the Feedback QR page, question editing/deleting, reward rules, workflow stage changes, and Loyalty counters.

Important:
The script creates timestamped backups before changing files.
