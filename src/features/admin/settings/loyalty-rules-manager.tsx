"use client";

import { useState, useTransition } from "react";
import { Gift, Plus, Save } from "lucide-react";
import { saveLoyaltyRuleSetting, type LoyaltyRuleSetting } from "@/app/admin/settings/loyalty-rules/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

const copy = {
  fa: { title:"قوانین وفاداری", desc:"تارگت شمارش و نوع جایزه را تعریف کنید. این صفحه فقط تنظیمات Ruleهاست.", name:"نام قانون", category:"کلید دسته", target:"تعداد هدف", rewardType:"نوع جایزه", value:"مقدار", label:"عنوان جایزه", active:"فعال", save:"ذخیره", add:"قانون جدید", edit:"ویرایش", percentage:"درصد تخفیف", fixed:"تخفیف ثابت OMR", free:"آیتم رایگان" },
  ar: { title:"قواعد الولاء", desc:"حدد عدد الهدف ونوع المكافأة لكل قاعدة.", name:"اسم القاعدة", category:"مفتاح الفئة", target:"الهدف", rewardType:"نوع المكافأة", value:"القيمة", label:"وصف المكافأة", active:"مفعل", save:"حفظ", add:"قاعدة جديدة", edit:"تعديل", percentage:"خصم نسبة", fixed:"خصم ثابت OMR", free:"عنصر مجاني" },
  en: { title:"Loyalty Rules", desc:"Configure counting targets and rewards. Operational customer counting stays on the Loyalty page.", name:"Rule name", category:"Category key", target:"Target count", rewardType:"Reward type", value:"Value", label:"Reward label", active:"Active", save:"Save", add:"New rule", edit:"Edit", percentage:"Percentage discount", fixed:"Fixed OMR discount", free:"Free item" },
};

const blank = (): LoyaltyRuleSetting => ({ id:"", name:"", categoryKey:"coffee", thresholdCount:5, rewardType:"free_item", rewardValue:1, rewardLabel:"1 free coffee", isActive:true });

export function LoyaltyRulesManager({ initialState }: { initialState: { success:boolean; message?:string; rules:LoyaltyRuleSetting[] } }) {
  const { language } = useAdminLanguage();
  const t = copy[language];
  const [rows, setRows] = useState(initialState.rules);
  const [form, setForm] = useState<LoyaltyRuleSetting>(blank());
  const [message, setMessage] = useState(initialState.message || "");
  const [pending, start] = useTransition();
  const input = "w-full rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none";

  const save = () => start(async () => {
    const result = await saveLoyaltyRuleSetting(form);
    setMessage(result.message || "");
    if (result.success) window.location.reload();
  });

  return <div className="space-y-5">
    <Card className="p-6"><h1 className="text-2xl font-black text-[color:var(--admin-text)]">{t.title}</h1><p className="mt-2 text-sm text-[color:var(--admin-muted)]">{t.desc}</p></Card>
    <Card className="p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <input className={input} placeholder={t.name} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <input className={input} placeholder={t.category} value={form.categoryKey} onChange={e=>setForm({...form,categoryKey:e.target.value})}/>
        <input className={input} type="number" min={1} placeholder={t.target} value={form.thresholdCount} onChange={e=>setForm({...form,thresholdCount:Number(e.target.value)})}/>
        <select className={input} value={form.rewardType} onChange={e=>setForm({...form,rewardType:e.target.value as LoyaltyRuleSetting['rewardType']})}><option value="percentage">{t.percentage}</option><option value="fixed">{t.fixed}</option><option value="free_item">{t.free}</option></select>
        <input className={input} type="number" min={0} step="0.001" placeholder={t.value} value={form.rewardValue} onChange={e=>setForm({...form,rewardValue:Number(e.target.value)})}/>
        <input className={input} placeholder={t.label} value={form.rewardLabel} onChange={e=>setForm({...form,rewardLabel:e.target.value})}/>
        <label className="flex items-center gap-2 rounded-xl border border-[color:var(--admin-border)] px-4 py-3 text-sm text-[color:var(--admin-muted)]"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/>{t.active}</label>
        <div className="flex gap-2"><Button onClick={save} disabled={pending}><Save className="h-4 w-4"/>{t.save}</Button><Button variant="secondary" onClick={()=>setForm(blank())}><Plus className="h-4 w-4"/>{t.add}</Button></div>
      </div>
      {message && <p className="mt-3 text-sm text-[color:var(--admin-muted)]">{message}</p>}
    </Card>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map(row=><Card key={row.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Gift className="h-4 w-4"/><h2 className="font-black text-[color:var(--admin-text)]">{row.name}</h2></div><p className="mt-2 text-sm text-[color:var(--admin-muted)]">{row.categoryKey} · {row.thresholdCount} → {row.rewardLabel || `${row.rewardValue} ${row.rewardType}`}</p></div><span className="text-xs text-[color:var(--admin-muted)]">{row.isActive?t.active:"Off"}</span></div><Button className="mt-4 w-full" variant="secondary" onClick={()=>setForm(row)}>{t.edit}</Button></Card>)}</div>
  </div>;
}
