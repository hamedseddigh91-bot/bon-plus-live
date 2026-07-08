-- Keep historical feedback answers intact while allowing archived questions
-- to disappear from the active question-management list.

alter table public.feedback_questions
  add column if not exists archived_at timestamptz null;

create index if not exists feedback_questions_business_archived_idx
  on public.feedback_questions (business_id, archived_at);

comment on column public.feedback_questions.archived_at is
  'Timestamp used for soft-archiving questions that already have historical answers.';
