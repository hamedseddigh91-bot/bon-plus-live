-- Bon Plus loyalty defaults: Coffee and Food counters.
-- Coffee: every 5 purchases -> 1 free coffee.
-- Food: every 10 purchases -> 10% discount reward.


update public.loyalty_program_rules r
set is_active = true, updated_at = now()
from public.businesses b
where r.business_id = b.id
  and b.slug = 'bon-plus-cafe'
  and lower(r.category_key) in ('coffee', 'food')
  and r.is_active = false;

insert into public.loyalty_program_rules (
  business_id,
  name,
  category_key,
  threshold_count,
  reward_type,
  reward_value,
  reward_label,
  message_en,
  message_ar,
  message_fa,
  is_active
)
select
  b.id,
  v.name,
  v.category_key,
  v.threshold_count,
  v.reward_type,
  v.reward_value,
  v.reward_label,
  v.message_en,
  v.message_ar,
  v.message_fa,
  true
from public.businesses b
cross join (
  values
    (
      'Coffee',
      'coffee',
      5,
      'free_item',
      0::numeric,
      'Free coffee',
      'You reached 5 coffee purchases. Your free coffee reward is ready.',
      'أكملت 5 مشتريات قهوة. مكافأة قهوة مجانية جاهزة.',
      '۵ خرید قهوه ثبت شد؛ جایزه یک قهوه رایگان آماده است.'
    ),
    (
      'Food',
      'food',
      10,
      'percentage',
      10::numeric,
      '10% discount',
      'You reached 10 food purchases. Your 10% discount reward is ready.',
      'أكملت 10 مشتريات طعام. مكافأة خصم 10٪ جاهزة.',
      '۱۰ خرید غذا ثبت شد؛ جایزه تخفیف ۱۰٪ آماده است.'
    )
) as v(
  name,
  category_key,
  threshold_count,
  reward_type,
  reward_value,
  reward_label,
  message_en,
  message_ar,
  message_fa
)
where b.slug = 'bon-plus-cafe'
  and not exists (
    select 1
    from public.loyalty_program_rules existing
    where existing.business_id = b.id
      and lower(existing.category_key) = lower(v.category_key)
  );
