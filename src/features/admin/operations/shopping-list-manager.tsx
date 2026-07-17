"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, ShoppingCart, Trash2, History, Printer, CheckCircle2 } from "lucide-react";
import {
  type ShoppingDepartment,
  type ShoppingListState,
  addShoppingListItem,
  deleteShoppingListItem,
  finalizeShoppingList,
  getShoppingListState,
  updateShoppingListItem,
} from "@/app/admin/operations/shopping-list/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

const text = {
  fa: {
    title: "لیست خرید هفتگی",
    subtitle: "بار، سالن و آشپزخانه هرکدوم می‌تونن مواد لازم رو به این لیست مشترک اضافه کنن.",
    history: "لیست‌های قبلی",
    addItem: "افزودن مورد به لیست",
    ingredient: "ماده اولیه",
    pickIngredient: "از لیست انتخاب کن",
    customName: "یا اسم دیگه‌ای بنویس",
    department: "بخش",
    bar: "بار",
    hall: "سالن",
    kitchen: "آشپزخانه",
    quantity: "مقدار",
    unit: "واحد",
    notes: "یادداشت (اختیاری)",
    add: "افزودن",
    empty: "هنوز موردی به لیست اضافه نشده.",
    requestedBy: "ثبت‌شده توسط",
    finalize: "نهایی کردن و خروجی گرفتن",
    print: "پرینت لیست فعلی",
    finalizeConfirm: "لیست نهایی می‌شود و برای دور بعد یک لیست خالی جدید شروع می‌شود. ادامه می‌دهید؟",
    finalizeSuccess: "لیست خرید نهایی شد.",
    remove: "حذف",
    save: "ذخیره",
  },
  ar: {
    title: "قائمة التسوق الأسبوعية",
    subtitle: "يمكن للبار والصالة والمطبخ إضافة المواد المطلوبة إلى هذه القائمة المشتركة.",
    history: "القوائم السابقة",
    addItem: "إضافة عنصر إلى القائمة",
    ingredient: "المادة الخام",
    pickIngredient: "اختر من القائمة",
    customName: "أو اكتب اسمًا آخر",
    department: "القسم",
    bar: "البار",
    hall: "الصالة",
    kitchen: "المطبخ",
    quantity: "الكمية",
    unit: "الوحدة",
    notes: "ملاحظات (اختياري)",
    add: "إضافة",
    empty: "لم تتم إضافة أي عنصر بعد.",
    requestedBy: "أضافه",
    finalize: "إنهاء والحصول على المخرجات",
    print: "طباعة القائمة الحالية",
    finalizeConfirm: "سيتم إنهاء القائمة وبدء قائمة جديدة فارغة للدورة القادمة. متابعة؟",
    finalizeSuccess: "تم إنهاء قائمة التسوق.",
    remove: "حذف",
    save: "حفظ",
  },
  en: {
    title: "Weekly shopping list",
    subtitle: "Bar, hall and kitchen can each add needed ingredients to this shared list.",
    history: "Past lists",
    addItem: "Add item to list",
    ingredient: "Ingredient",
    pickIngredient: "Pick from list",
    customName: "or type another name",
    department: "Department",
    bar: "Bar",
    hall: "Hall",
    kitchen: "Kitchen",
    quantity: "Quantity",
    unit: "Unit",
    notes: "Notes (optional)",
    add: "Add",
    empty: "No items added yet.",
    requestedBy: "Added by",
    finalize: "Finalize & get output",
    print: "Print current list",
    finalizeConfirm: "The list will be finalized and a new empty list will start for the next cycle. Continue?",
    finalizeSuccess: "Shopping list finalized.",
    remove: "Remove",
    save: "Save",
  },
} as const;

const departments: ShoppingDepartment[] = ["bar", "hall", "kitchen"];

export function ShoppingListManager({ initialState }: { initialState: ShoppingListState }) {
  const { language } = useAdminLanguage();
  const t = text[language];
  const [state, setState] = useState(initialState);
  const [message, setMessage] = useState<string | null>(initialState.success ? null : initialState.message ?? null);
  const [isPending, startTransition] = useTransition();
  const [isFinalizing, startFinalizeTransition] = useTransition();

  const [form, setForm] = useState({
    ingredientId: "",
    customName: "",
    unit: "",
    department: "bar" as ShoppingDepartment,
    quantity: "",
    notes: "",
  });

  const grouped = useMemo(() => {
    const map: Record<ShoppingDepartment, typeof state.items> = { bar: [], hall: [], kitchen: [] };
    for (const item of state.items) map[item.department].push(item);
    return map;
  }, [state.items]);

  const refresh = () => {
    startTransition(async () => {
      const result = await getShoppingListState();
      setState(result);
    });
  };

  const submitAdd = () => {
    const selectedIngredient = state.ingredients.find((ingredient) => ingredient.id === form.ingredientId);
    const ingredientName = selectedIngredient?.name || form.customName.trim();
    const qty = Number(form.quantity);
    if (!ingredientName || !(qty > 0)) return;

    startTransition(async () => {
      const result = await addShoppingListItem({
        ingredientId: selectedIngredient?.id ?? null,
        ingredientName,
        unit: selectedIngredient?.unit ?? form.unit,
        department: form.department,
        quantity: qty,
        notes: form.notes,
      });
      if (result.success) {
        setForm((current) => ({ ...current, ingredientId: "", customName: "", unit: "", quantity: "", notes: "" }));
        refresh();
      } else {
        setMessage(result.message ?? "Could not add item.");
      }
    });
  };

  const removeItem = (id: string) => {
    startTransition(async () => {
      const result = await deleteShoppingListItem(id);
      if (result.success) refresh();
      else setMessage(result.message ?? "Could not remove item.");
    });
  };

  const editQuantity = (id: string, quantity: number) => {
    if (!(quantity > 0)) return;
    startTransition(async () => {
      const result = await updateShoppingListItem({ id, quantity });
      if (result.success) refresh();
    });
  };

  const finalize = () => {
    if (!window.confirm(t.finalizeConfirm)) return;
    startFinalizeTransition(async () => {
      const result = await finalizeShoppingList();
      if (result.success) {
        setMessage(t.finalizeSuccess);
        window.print();
        refresh();
      } else {
        setMessage(result.message ?? "Could not finalize.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-amber-300/10 text-amber-200"><ShoppingCart className="h-5 w-5" /></div>
          <div>
            <h1 className="text-xl font-black text-[color:var(--admin-text)]">{t.title}</h1>
            <p className="text-sm text-[color:var(--admin-muted)]">{t.subtitle}</p>
          </div>
        </div>
        <Link href="/admin/operations/shopping-list/history">
          <Button variant="secondary"><History className="h-4 w-4" />{t.history}</Button>
        </Link>
      </div>

      {message && <Card className="p-4 text-sm text-[color:var(--admin-text)] print:hidden">{message}</Card>}

      <Card className="p-5 print:hidden">
        <h2 className="mb-4 text-sm font-black text-[color:var(--admin-text)]">{t.addItem}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs font-bold text-[color:var(--admin-muted)]">{t.ingredient}</label>
            <select
              value={form.ingredientId}
              onChange={(event) => setForm((current) => ({ ...current, ingredientId: event.target.value, customName: "" }))}
              className="w-full rounded-2xl border border-[color:var(--admin-border)] bg-black/20 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none"
            >
              <option value="">{t.pickIngredient}</option>
              {state.ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>{ingredient.name}{ingredient.unit ? ` (${ingredient.unit})` : ""}</option>
              ))}
            </select>
            {!form.ingredientId && (
              <input
                value={form.customName}
                onChange={(event) => setForm((current) => ({ ...current, customName: event.target.value }))}
                placeholder={t.customName}
                className="mt-2 w-full rounded-2xl border border-[color:var(--admin-border)] bg-black/20 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[color:var(--admin-muted)]">{t.department}</label>
            <select
              value={form.department}
              onChange={(event) => setForm((current) => ({ ...current, department: event.target.value as ShoppingDepartment }))}
              className="w-full rounded-2xl border border-[color:var(--admin-border)] bg-black/20 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none"
            >
              <option value="bar">{t.bar}</option>
              <option value="hall">{t.hall}</option>
              <option value="kitchen">{t.kitchen}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[color:var(--admin-muted)]">{t.quantity}</label>
            <input type="number" step="0.01" min="0" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--admin-border)] bg-black/20 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none" />
          </div>
          {!form.ingredientId && (
            <div>
              <label className="mb-1 block text-xs font-bold text-[color:var(--admin-muted)]">{t.unit}</label>
              <input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--admin-border)] bg-black/20 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none" />
            </div>
          )}
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs font-bold text-[color:var(--admin-muted)]">{t.notes}</label>
            <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--admin-border)] bg-black/20 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none" />
          </div>
        </div>
        <Button className="mt-4" onClick={submitAdd} loading={isPending} disabled={(!form.ingredientId && !form.customName.trim()) || !(Number(form.quantity) > 0)}>
          <Plus className="h-4 w-4" />{t.add}
        </Button>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept} className="p-4">
            <h3 className="mb-3 text-sm font-black text-[color:var(--admin-text)]">{t[dept]}</h3>
            <div className="space-y-2">
              {grouped[dept].length === 0 && <p className="text-xs text-[color:var(--admin-muted)]">{t.empty}</p>}
              {grouped[dept].map((item) => (
                <div key={item.id} className="rounded-xl border border-[color:var(--admin-border)] bg-black/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[color:var(--admin-text)]">{item.ingredientName}</p>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-[color:var(--admin-muted)] print:hidden"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={item.quantity}
                      onBlur={(event) => { const v = Number(event.target.value); if (v !== item.quantity) editQuantity(item.id, v); }}
                      className="w-20 rounded-lg border border-[color:var(--admin-border)] bg-black/20 px-2 py-1 text-xs text-[color:var(--admin-text)] outline-none print:hidden"
                    />
                    <span className="hidden text-sm text-[color:var(--admin-text)] print:inline">{item.quantity}</span>
                    <span className="text-xs text-[color:var(--admin-muted)]">{item.unit ?? ""}</span>
                  </div>
                  {item.notes && <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{item.notes}</p>}
                  {item.requestedByEmail && <p className="mt-1 text-[10px] text-[color:var(--admin-muted)]">{t.requestedBy}: {item.requestedByEmail}</p>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button variant="secondary" onClick={() => window.print()} disabled={state.items.length === 0}>
          <Printer className="h-4 w-4" />{t.print}
        </Button>
        <Button onClick={finalize} loading={isFinalizing} disabled={state.items.length === 0}>
          <CheckCircle2 className="h-4 w-4" />{t.finalize}
        </Button>
      </div>
    </div>
  );
}
