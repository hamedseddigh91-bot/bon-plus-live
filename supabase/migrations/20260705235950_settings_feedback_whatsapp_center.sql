create table if not exists public.feedback_response_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  band_key text not null check (band_key in ('high','mid','low')),
  min_score numeric null,
  max_score numeric null,
  response_method text not null default 'thanks' check (response_method in ('thanks','percent_discount','fixed_discount','free_item')),
  response_value numeric null,
  free_item_text text null,
  message_fa text not null default '',
  message_ar text not null default '',
  message_en text not null default '',
  request_google_review boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, band_key)
);

create table if not exists public.feedback_google_review_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  is_enabled boolean not null default true,
  message_fa text not null default '',
  message_ar text not null default '',
  message_en text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_message_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  template_key text not null,
  label text not null,
  message_fa text not null default '',
  message_ar text not null default '',
  message_en text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, template_key)
);

alter table public.feedback_response_rules enable row level security;
alter table public.feedback_google_review_settings enable row level security;
alter table public.whatsapp_message_templates enable row level security;

insert into public.feedback_response_rules (business_id,band_key,min_score,max_score,response_method,request_google_review,sort_order,message_fa,message_ar,message_en)
select b.id,x.band_key,x.min_score,x.max_score,'thanks',x.review,x.sort_order,x.fa,x.ar,x.en
from public.businesses b cross join (values
 ('high',4::numeric,null::numeric,true,10,'از بازخورد ارزشمند شما ممنونیم.','شكراً لملاحظاتك القيّمة.','Thank you for your valuable feedback.'),
 ('mid',2.000001::numeric,3.999999::numeric,false,20,'از بازخورد شما ممنونیم. برای بهتر شدن تجربه شما تلاش می‌کنیم.','شكراً لملاحظاتك. سنعمل على تحسين تجربتك.','Thank you for your feedback. We will work to improve your experience.'),
 ('low',null::numeric,2::numeric,false,30,'متأسفیم که تجربه شما رضایت‌بخش نبوده است. تیم ما موضوع را پیگیری خواهد کرد.','نأسف لأن تجربتك لم تكن مرضية. سيتابع فريقنا الأمر.','We are sorry your experience was not satisfactory. Our team will follow up.')
) as x(band_key,min_score,max_score,review,sort_order,fa,ar,en)
on conflict (business_id,band_key) do nothing;

insert into public.feedback_google_review_settings (business_id,is_enabled,message_fa,message_ar,message_en)
select id,true,'اگر از تجربه خود راضی بودید، خوشحال می‌شویم نظر خود را در Google ثبت کنید.','إذا كنت راضياً عن تجربتك، يسعدنا تقييمك على Google.','If you enjoyed your experience, we would appreciate your Google review.' from public.businesses
on conflict (business_id) do nothing;

insert into public.whatsapp_message_templates (business_id,template_key,label,message_fa,message_ar,message_en,sort_order)
select b.id,x.k,x.l,x.fa,x.ar,x.en,x.s from public.businesses b cross join (values
('feedback_high','Feedback high','سلام {customer_name}، ممنون که تجربه‌تان را با ما به اشتراک گذاشتید. امتیاز شما {score} از 5 بود.','مرحباً {customer_name}، شكراً لمشاركة تجربتك معنا. تقييمك {score} من 5.','Hi {customer_name}, thank you for sharing your experience. Your score was {score}/5.',10),
('feedback_mid','Feedback mid','سلام {customer_name}، ممنون از بازخورد شما. نظر شما را بررسی می‌کنیم تا تجربه بهتری بسازیم.','مرحباً {customer_name}، شكراً لملاحظاتك. سنراجعها لتحسين تجربتك.','Hi {customer_name}, thank you for your feedback. We will review it to improve your experience.',20),
('feedback_low','Feedback low','سلام {customer_name}، بابت تجربه نامطلوب شما متأسفیم. تیم ما موضوع را پیگیری می‌کند.','مرحباً {customer_name}، نأسف لتجربتك غير المرضية. سيتابع فريقنا الأمر.','Hi {customer_name}, we are sorry about your experience. Our team will follow up.',30),
('discount_early','Discount early reminder','سلام، کد تخفیف شما {code} تا {expiry_date} معتبر است.','مرحباً، كود الخصم {code} صالح حتى {expiry_date}.','Hi, your discount code {code} is valid until {expiry_date}.',40),
('discount_expiry','Discount expiry reminder','یادآوری: فقط {remaining_days} روز تا پایان اعتبار کد {code} باقی مانده است.','تذكير: تبقى {remaining_days} أيام فقط لاستخدام الكود {code}.','Reminder: only {remaining_days} days remain to use code {code}.',50),
('cash_closing','Cash closing','گزارش صندوق {date}\nنقد: {cash}\nکارت: {card}\nطلبات: {talabat}\nجمع: {total}\nمغایرت: {discrepancy}','تقرير إغلاق الصندوق {date}\nنقد: {cash}\nبطاقة: {card}\nطلبات: {talabat}\nالإجمالي: {total}\nالفرق: {discrepancy}','Cash closing {date}\nCash: {cash}\nCard: {card}\nTalabat: {talabat}\nTotal: {total}\nDiscrepancy: {discrepancy}',60),
('invoice','Invoice','فاکتور {invoice_no}\nتاریخ: {date}\nتأمین‌کننده: {supplier}\nمبلغ: {amount}\nوضعیت: {status}','الفاتورة {invoice_no}\nالتاريخ: {date}\nالمورد: {supplier}\nالمبلغ: {amount}\nالحالة: {status}','Invoice {invoice_no}\nDate: {date}\nSupplier: {supplier}\nAmount: {amount}\nStatus: {status}',70),
('loyalty_progress','Loyalty progress','سلام {customer_name}، تا الان {current_count} بار از برنامه وفاداری استفاده کرده‌اید. فقط {remaining_count} بار دیگر تا جایزه {reward} باقی مانده است.','مرحباً {customer_name}، لديك الآن {current_count}. تبقى {remaining_count} فقط للحصول على {reward}.','Hi {customer_name}, you are at {current_count}. Only {remaining_count} more to unlock {reward}.',80),
('loyalty_reward','Loyalty reward','تبریک {customer_name}! شما به هدف {target_count} رسیدید و جایزه {reward} برایتان آماده است.','مبروك {customer_name}! وصلت إلى الهدف {target_count} ومكافأتك {reward} جاهزة.','Congratulations {customer_name}! You reached {target_count} and your reward {reward} is ready.',90)
) as x(k,l,fa,ar,en,s)
on conflict (business_id,template_key) do nothing;
