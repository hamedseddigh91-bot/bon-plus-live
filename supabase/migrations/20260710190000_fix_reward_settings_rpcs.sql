-- Fix reward settings RPCs to match public.discount_settings,
-- whose primary key is business_id and which has no id/created_at columns.

CREATE OR REPLACE FUNCTION "public"."admin_get_rewards_fast"("p_slug" "text" DEFAULT 'bon-plus-cafe'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_business record;
  v_discount_settings record;
  v_rewards jsonb := '[]'::jsonb;
begin
  select
    id,
    name,
    slug
    into v_business
  from public.businesses
  where slug = p_slug
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'Business was not found.',
      'business', null,
      'discountSettings', null,
      'rewards', '[]'::jsonb
    );
  end if;

  select
    business_id,
    default_expiry_days,
    default_usage_limit,
    code_prefix,
    auto_generate_enabled,
    updated_at
    into v_discount_settings
  from public.discount_settings
  where business_id = v_business.id
  limit 1;

  if not found then
    insert into public.discount_settings (
      business_id,
      default_expiry_days,
      default_usage_limit,
      code_prefix,
      auto_generate_enabled
    )
    values (
      v_business.id,
      7,
      1,
      'CR',
      true
    )
    returning
      business_id,
      default_expiry_days,
      default_usage_limit,
      code_prefix,
      auto_generate_enabled,
      updated_at
    into v_discount_settings;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', reward.id,
        'businessId', reward.business_id,
        'segment', reward.segment,
        'active', reward.is_active,
        'messageEn', reward.message_en,
        'messageAr', reward.message_ar,
        'messageFa', reward.message_fa,
        'rewardType', reward.reward_type,
        'discountValue', reward.discount_value,
        'freeItemName', reward.free_item_name,
        'customExpiryDays', reward.custom_expiry_days,
        'customUsageLimit', reward.custom_usage_limit,
        'createdAt', reward.created_at,
        'updatedAt', reward.updated_at
      )
      order by
        case reward.segment
          when 'satisfied'::public.feedback_segment then 1
          when 'medium'::public.feedback_segment then 2
          when 'unhappy'::public.feedback_segment then 3
          else 9
        end
    ),
    '[]'::jsonb
  )
  into v_rewards
  from public.reward_rules reward
  where reward.business_id = v_business.id;

  return jsonb_build_object(
    'success', true,
    'business', jsonb_build_object(
      'id', v_business.id,
      'name', v_business.name,
      'slug', v_business.slug
    ),
    'discountSettings', jsonb_build_object(
      'businessId', v_discount_settings.business_id,
      'defaultExpiryDays', v_discount_settings.default_expiry_days,
      'defaultUsageLimit', v_discount_settings.default_usage_limit,
      'codePrefix', v_discount_settings.code_prefix,
      'autoGenerateEnabled', v_discount_settings.auto_generate_enabled,
      'updatedAt', v_discount_settings.updated_at
    ),
    'rewards', v_rewards
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', sqlerrm,
      'business', null,
      'discountSettings', null,
      'rewards', '[]'::jsonb
    );
end;
$$;

CREATE OR REPLACE FUNCTION "public"."admin_save_rewards_fast"("p_business_id" "uuid", "p_discount_settings" "jsonb", "p_rewards" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_business record;
  v_default_expiry_days integer;
  v_default_usage_limit integer;
  v_code_prefix text;
  v_auto_generate_enabled boolean;

  v_reward jsonb;
  v_segment public.feedback_segment;
  v_reward_type public.reward_type;
  v_discount_value numeric;
  v_custom_expiry_days integer;
  v_custom_usage_limit integer;
begin
  select
    id,
    name,
    slug
    into v_business
  from public.businesses
  where id = p_business_id
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'Business was not found.'
    );
  end if;

  if jsonb_typeof(coalesce(p_discount_settings, '{}'::jsonb)) <> 'object' then
    return jsonb_build_object(
      'success', false,
      'message', 'Invalid discount settings payload.'
    );
  end if;

  if jsonb_typeof(coalesce(p_rewards, '[]'::jsonb)) <> 'array' then
    return jsonb_build_object(
      'success', false,
      'message', 'Invalid rewards payload.'
    );
  end if;

  v_default_expiry_days := greatest(coalesce((p_discount_settings ->> 'defaultExpiryDays')::integer, 7), 1);
  v_default_usage_limit := greatest(coalesce((p_discount_settings ->> 'defaultUsageLimit')::integer, 1), 1);
  v_code_prefix := regexp_replace(upper(coalesce(p_discount_settings ->> 'codePrefix', 'CR')), '[^A-Z0-9]', '', 'g');
  v_auto_generate_enabled := coalesce((p_discount_settings ->> 'autoGenerateEnabled')::boolean, true);

  if length(v_code_prefix) = 0 then
    v_code_prefix := 'CR';
  end if;

  insert into public.discount_settings (
    business_id,
    default_expiry_days,
    default_usage_limit,
    code_prefix,
    auto_generate_enabled
  )
  values (
    v_business.id,
    v_default_expiry_days,
    v_default_usage_limit,
    v_code_prefix,
    v_auto_generate_enabled
  )
  on conflict (business_id) do update
  set
    default_expiry_days = excluded.default_expiry_days,
    default_usage_limit = excluded.default_usage_limit,
    code_prefix = excluded.code_prefix,
    auto_generate_enabled = excluded.auto_generate_enabled,
    updated_at = now();

  for v_reward in select * from jsonb_array_elements(p_rewards)
  loop
    v_segment := (v_reward ->> 'segment')::public.feedback_segment;
    v_reward_type := (v_reward ->> 'rewardType')::public.reward_type;

    if v_reward_type in ('percentage'::public.reward_type, 'fixed'::public.reward_type) then
      v_discount_value := greatest(coalesce((v_reward ->> 'discountValue')::numeric, 0), 0);
    else
      v_discount_value := null;
    end if;

    if nullif(v_reward ->> 'customExpiryDays', '') is null then
      v_custom_expiry_days := null;
    else
      v_custom_expiry_days := greatest((v_reward ->> 'customExpiryDays')::integer, 1);
    end if;

    if nullif(v_reward ->> 'customUsageLimit', '') is null then
      v_custom_usage_limit := null;
    else
      v_custom_usage_limit := greatest((v_reward ->> 'customUsageLimit')::integer, 1);
    end if;

    update public.reward_rules
    set
      is_active = coalesce((v_reward ->> 'active')::boolean, true),
      message_en = trim(coalesce(v_reward ->> 'messageEn', 'Thank you for your feedback.')),
      message_ar = trim(coalesce(v_reward ->> 'messageAr', v_reward ->> 'messageEn', 'Thank you for your feedback.')),
      message_fa = trim(coalesce(v_reward ->> 'messageFa', v_reward ->> 'messageEn', 'Thank you for your feedback.')),
      reward_type = v_reward_type,
      discount_value = v_discount_value,
      free_item_name = case
        when v_reward_type = 'free_item'::public.reward_type
        then nullif(trim(coalesce(v_reward ->> 'freeItemName', '')), '')
        else null
      end,
      custom_expiry_days = v_custom_expiry_days,
      custom_usage_limit = v_custom_usage_limit,
      updated_at = now()
    where business_id = v_business.id
      and segment = v_segment;

    if not found then
      insert into public.reward_rules (
        business_id,
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
      )
      values (
        v_business.id,
        v_segment,
        coalesce((v_reward ->> 'active')::boolean, true),
        trim(coalesce(v_reward ->> 'messageEn', 'Thank you for your feedback.')),
        trim(coalesce(v_reward ->> 'messageAr', v_reward ->> 'messageEn', 'Thank you for your feedback.')),
        trim(coalesce(v_reward ->> 'messageFa', v_reward ->> 'messageEn', 'Thank you for your feedback.')),
        v_reward_type,
        v_discount_value,
        case
          when v_reward_type = 'free_item'::public.reward_type
          then nullif(trim(coalesce(v_reward ->> 'freeItemName', '')), '')
          else null
        end,
        v_custom_expiry_days,
        v_custom_usage_limit
      );
    end if;
  end loop;

  insert into public.activity_logs (
    business_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_business.id,
    'rewards_updated',
    'reward_rules',
    null,
    jsonb_build_object(
      'discountSettings', p_discount_settings,
      'rewardCount', jsonb_array_length(p_rewards)
    )
  );

  return public.admin_get_rewards_fast(v_business.slug);
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', sqlerrm
    );
end;
$$;
