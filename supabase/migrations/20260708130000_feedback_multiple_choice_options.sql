-- Add localized option definitions for single-select multiple choice feedback questions.
-- The existing question_type remains `text` in PostgreSQL so existing submission RPCs
-- continue storing the selected canonical label in feedback_answers.answer_text.

alter table public.feedback_questions
  add column if not exists options_json jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'feedback_questions_options_json_array_check'
      and conrelid = 'public.feedback_questions'::regclass
  ) then
    alter table public.feedback_questions
      add constraint feedback_questions_options_json_array_check
      check (jsonb_typeof(options_json) = 'array');
  end if;
end $$;
