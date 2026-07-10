-- Clean up submit_customer_feedback_fast lint warnings without changing behavior.
-- Removes two unused variables and adds an explicit enum cast.

CREATE OR REPLACE FUNCTION "public"."submit_customer_feedback_fast"("p_business_id" "uuid", "p_phone" "text", "p_language" "public"."language_code", "p_answers" "jsonb", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_phone text;
  v_business_id uuid;
  v_google_maps_review_url text;

  v_feedback_lock_hours integer := 24;
  v_feedback_auto_source_key text := 'feedback';
  v_lock_since timestamptz;

  v_source_id uuid;

  v_customer_id uuid;
  v_customer_found boolean := false;
  v_existing_feedback_count integer := 0;
  v_existing_average_score numeric := 0;
  v_next_feedback_count integer := 1;
  v_next_average_score numeric := 0;

  v_average_score numeric := 0;
  v_segment public.feedback_segment := 'unhappy'::public.feedback_segment;

  v_reward_rule record;
  v_reward_rule_found boolean := false;
  v_customer_message text := 'Thank you for your feedback.';
  v_google_maps_link_shown boolean := false;
  v_reward_generated boolean := false;

  v_submission_id uuid;

  v_default_expiry_days integer := 7;
  v_default_usage_limit integer := 1;
  v_code_prefix text := 'CR';
  v_auto_generate_enabled boolean := true;

  v_code text;
  v_expires_at timestamptz;
  v_reward_json jsonb := null;

  v_question record;
begin
  v_phone := regexp_replace(trim(coalesce(p_phone, '')), '\s+', '', 'g');

  if p_business_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Business is missing.'
    );
  end if;

  if length(v_phone) < 5 then
    return jsonb_build_object(
      'success', false,
      'message', 'Phone number is too short.'
    );
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    return jsonb_build_object(
      'success', false,
      'message', 'Invalid feedback answers.'
    );
  end if;

  select id, google_maps_review_url
    into v_business_id, v_google_maps_review_url
  from public.businesses
  where id = p_business_id
  limit 1;

  if v_business_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Business was not found.'
    );
  end if;

  select
    coalesce(feedback_lock_hours, 24),
    coalesce(feedback_auto_source_key, 'feedback')
    into v_feedback_lock_hours, v_feedback_auto_source_key
  from public.app_settings
  where business_id = v_business_id
  limit 1;

  if v_feedback_lock_hours > 0 then
    v_lock_since := now() - make_interval(hours => v_feedback_lock_hours);

    if exists (
      select 1
      from public.feedback_submissions
      where business_id = v_business_id
        and phone = v_phone
        and created_at >= v_lock_since
      limit 1
    ) then
      return jsonb_build_object(
        'success', false,
        'message', 'You have already submitted feedback recently. Please try again later.'
      );
    end if;
  end if;

  for v_question in
    select id, is_required
    from public.feedback_questions
    where business_id = v_business_id
      and is_active = true
    order by display_order asc
  loop
    if v_question.is_required and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) as answer_item
      where answer_item ->> 'questionId' = v_question.id::text
      limit 1
    ) then
      return jsonb_build_object(
        'success', false,
        'message', 'Please answer all required questions.'
      );
    end if;
  end loop;

  select
    coalesce(round(avg((answer_item ->> 'value')::numeric), 2), 0)
    into v_average_score
  from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) as answer_item
  join public.feedback_questions question
    on question.id::text = answer_item ->> 'questionId'
  where question.business_id = v_business_id
    and question.is_active = true
    and question.question_type in ('star'::public.question_type, 'emoji'::public.question_type)
    and (answer_item ->> 'value') ~ '^[0-9]+(\.[0-9]+)?$'
    and (answer_item ->> 'value')::numeric between 1 and 5;

  v_average_score := coalesce(v_average_score, 0);

  if v_average_score >= 4 then
    v_segment := 'satisfied';
  elsif v_average_score > 2 then
    v_segment := 'medium';
  else
    v_segment := 'unhappy';
  end if;

  select id
    into v_source_id
  from public.customer_sources
  where business_id = v_business_id
    and source_key = v_feedback_auto_source_key
  limit 1;

  select id, coalesce(feedback_count, 0), coalesce(average_score, 0)
    into v_customer_id, v_existing_feedback_count, v_existing_average_score
  from public.customers
  where business_id = v_business_id
    and phone = v_phone
  limit 1
  for update;

  v_customer_found := found;

  if v_customer_found then
    v_next_feedback_count := v_existing_feedback_count + 1;

    if v_existing_feedback_count > 0 then
      v_next_average_score := round(
        ((v_existing_average_score * v_existing_feedback_count) + v_average_score)
        / v_next_feedback_count,
        2
      );
    else
      v_next_average_score := v_average_score;
    end if;

    update public.customers
    set
      language = p_language,
      source_id = v_source_id,
      last_seen_at = now(),
      feedback_count = v_next_feedback_count,
      average_score = v_next_average_score,
      updated_at = now()
    where id = v_customer_id;
  else
    insert into public.customers (
      business_id,
      phone,
      language,
      source_id,
      feedback_count,
      average_score
    )
    values (
      v_business_id,
      v_phone,
      p_language,
      v_source_id,
      1,
      v_average_score
    )
    returning id into v_customer_id;
  end if;

  select
    segment,
    is_active,
    message_en,
    message_ar,
    message_fa,
    reward_type,
    discount_value,
    free_item_name,
    custom_expiry_days,
    custom_usage_limit
    into v_reward_rule
  from public.reward_rules
  where business_id = v_business_id
    and segment = v_segment
  limit 1;

  v_reward_rule_found := found;

  if v_reward_rule_found then
    if p_language = 'ar' then
      v_customer_message := coalesce(v_reward_rule.message_ar, v_reward_rule.message_en, 'Thank you for your feedback.');
    elsif p_language = 'fa' then
      v_customer_message := coalesce(v_reward_rule.message_fa, v_reward_rule.message_en, 'Thank you for your feedback.');
    else
      v_customer_message := coalesce(v_reward_rule.message_en, 'Thank you for your feedback.');
    end if;
  end if;

  v_google_maps_link_shown := v_segment = 'satisfied' and v_google_maps_review_url is not null;
  v_reward_generated :=
    v_reward_rule_found
    and coalesce(v_reward_rule.is_active, false)
    and v_reward_rule.reward_type <> 'thank_you'::public.reward_type;

  insert into public.feedback_submissions (
    business_id,
    customer_id,
    source_id,
    phone,
    language,
    overall_score,
    segment,
    customer_message,
    google_maps_link_shown,
    reward_generated,
    user_agent
  )
  values (
    v_business_id,
    v_customer_id,
    v_source_id,
    v_phone,
    p_language,
    v_average_score,
    v_segment,
    v_customer_message,
    v_google_maps_link_shown,
    v_reward_generated,
    p_user_agent
  )
  returning id into v_submission_id;

  insert into public.feedback_answers (
    business_id,
    feedback_submission_id,
    question_id,
    question_type,
    answer_text,
    score_value
  )
  select
    v_business_id,
    v_submission_id,
    question.id,
    question.question_type,
    case
      when question.question_type in ('star'::public.question_type, 'emoji'::public.question_type) then null
      else left(coalesce(answer_item ->> 'value', ''), 2000)
    end,
    case
      when question.question_type in ('star'::public.question_type, 'emoji'::public.question_type)
        and (answer_item ->> 'value') ~ '^[0-9]+(\.[0-9]+)?$'
      then (answer_item ->> 'value')::numeric
      else null
    end
  from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) as answer_item
  join public.feedback_questions question
    on question.id::text = answer_item ->> 'questionId'
  where question.business_id = v_business_id
    and question.is_active = true;

  if v_reward_rule_found and coalesce(v_reward_rule.is_active, false) then
    if v_reward_rule.reward_type = 'thank_you'::public.reward_type then
      v_reward_json := jsonb_build_object(
        'type', 'thank_you'
      );
    else
      select
        coalesce(default_expiry_days, 7),
        coalesce(default_usage_limit, 1),
        coalesce(code_prefix, 'CR'),
        coalesce(auto_generate_enabled, true)
        into v_default_expiry_days,
             v_default_usage_limit,
             v_code_prefix,
             v_auto_generate_enabled
      from public.discount_settings
      where business_id = v_business_id
      limit 1;

      if v_auto_generate_enabled then
        v_default_expiry_days := coalesce(v_reward_rule.custom_expiry_days, v_default_expiry_days, 7);
        v_default_usage_limit := coalesce(v_reward_rule.custom_usage_limit, v_default_usage_limit, 1);
        v_code_prefix := regexp_replace(upper(coalesce(v_code_prefix, 'CR')), '[^A-Z0-9]', '', 'g');

        if length(v_code_prefix) = 0 then
          v_code_prefix := 'CR';
        end if;

        v_code := v_code_prefix || '-' || substring(upper(replace(gen_random_uuid()::text, '-', '')) from 1 for 10);
        v_expires_at := now() + make_interval(days => v_default_expiry_days);

        insert into public.discount_codes (
          business_id,
          customer_id,
          feedback_submission_id,
          code,
          source,
          reason,
          reward_type,
          discount_value,
          free_item_name,
          expires_at,
          usage_limit,
          used_count,
          status
        )
        values (
          v_business_id,
          v_customer_id,
          v_submission_id,
          v_code,
          'system'::public.discount_code_source,
          'Feedback reward: ' || v_segment::text,
          v_reward_rule.reward_type,
          v_reward_rule.discount_value,
          v_reward_rule.free_item_name,
          v_expires_at,
          v_default_usage_limit,
          0,
          'active'::public.discount_code_status
        );

        v_reward_json := jsonb_build_object(
          'type', v_reward_rule.reward_type,
          'code', v_code,
          'discountValue', v_reward_rule.discount_value,
          'freeItemName', v_reward_rule.free_item_name,
          'expiresAt', v_expires_at
        );
      end if;
    end if;
  end if;

  if v_segment = 'unhappy'::public.feedback_segment then
    insert into public.notifications (
      business_id,
      type,
      title,
      body,
      severity,
      feedback_submission_id
    )
    values (
      v_business_id,
      'low_score_feedback',
      'Low score feedback',
      'Customer ' || v_phone || ' submitted a score of ' || v_average_score::text || '.',
      'danger',
      v_submission_id
    );
  end if;

  insert into public.activity_logs (
    business_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_business_id,
    'feedback_submitted',
    'feedback_submission',
    v_submission_id,
    jsonb_build_object(
      'phone', v_phone,
      'segment', v_segment,
      'averageScore', v_average_score,
      'rewardGenerated', coalesce(v_reward_json ? 'code', false)
    )
  );

  return jsonb_build_object(
    'success', true,
    'message', v_customer_message,
    'segment', v_segment,
    'averageScore', v_average_score,
    'googleMapsReviewUrl',
      case
        when v_google_maps_link_shown then v_google_maps_review_url
        else null
      end,
    'reward', v_reward_json
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', sqlerrm
    );
end;
$_$;

