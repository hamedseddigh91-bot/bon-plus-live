Bon Plus QA Feedback Batch 1 v5

Purpose:
1. CRM Feedback: show New, Follow-up, and Resolved as three explicit lists.
2. Keep the stage selector for moving feedback between all three lists.
3. Increase the feedback fetch window so older workflow-stage items are visible.
4. Feedback Questions: unanswered questions hard-delete; answered questions archive and disappear from the live management list while preserving historical answers.

Run from project root:
  powershell -ExecutionPolicy Bypass -File .\bon-plus-qa-feedback-batch-1-v5\apply-qa-feedback-batch-1-v5.ps1

Then:
  npx supabase db push
  npm run build
