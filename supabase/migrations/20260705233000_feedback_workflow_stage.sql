alter table public.feedback_submissions
  add column if not exists workflow_stage text;

update public.feedback_submissions submission
set workflow_stage = case
  when exists (
    select 1
    from public.feedback_recovery_cases recovery
    where recovery.feedback_submission_id = submission.id
      and recovery.status in ('resolved', 'closed')
  ) then 'resolved'
  when exists (
    select 1
    from public.feedback_recovery_cases recovery
    where recovery.feedback_submission_id = submission.id
      and recovery.status in ('open', 'in_progress')
  ) then 'follow_up'
  when coalesce(submission.overall_score, 0) <= 2 then 'follow_up'
  else 'new'
end
where workflow_stage is null;

alter table public.feedback_submissions
  alter column workflow_stage set default 'new';

alter table public.feedback_submissions
  alter column workflow_stage set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'feedback_submissions_workflow_stage_check'
      and conrelid = 'public.feedback_submissions'::regclass
  ) then
    alter table public.feedback_submissions
      add constraint feedback_submissions_workflow_stage_check
      check (workflow_stage in ('new', 'follow_up', 'resolved'));
  end if;
end $$;

create or replace function public.set_feedback_workflow_stage()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.workflow_stage is null then
    new.workflow_stage := case
      when coalesce(new.overall_score, 0) <= 2 then 'follow_up'
      else 'new'
    end;
  elsif tg_op = 'INSERT' and coalesce(new.overall_score, 0) <= 2 and new.workflow_stage = 'new' then
    new.workflow_stage := 'follow_up';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_feedback_workflow_stage on public.feedback_submissions;
create trigger trg_set_feedback_workflow_stage
before insert on public.feedback_submissions
for each row
execute function public.set_feedback_workflow_stage();

create index if not exists idx_feedback_submissions_workflow_stage
  on public.feedback_submissions (business_id, workflow_stage, created_at desc);
