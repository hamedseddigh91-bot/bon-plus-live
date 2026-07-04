"use client";

import { useMemo, useState, useTransition } from "react";
import { Calculator, Download, Package, Plus, Printer, Save, Search } from "lucide-react";
import type { RecipeComponent, RecipeCostingItem, RecipeCostingState } from "@/app/admin/recipes/actions";
import { saveRecipeCostingItem } from "@/app/admin/recipes/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage, type AdminLanguage } from "@/lib/admin-language";

type RecipeCostingPageProps = {
  initialState: RecipeCostingState;
};

function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function ingredientUnitCost(item: Pick<RecipeCostingItem, "purchaseQty" | "purchasePrice" | "wastePercent">) {
  const qty = numberValue(item.purchaseQty);
  const price = numberValue(item.purchasePrice);
  const waste = numberValue(item.wastePercent);
  const usableQty = qty * (1 - waste / 100);

  if (usableQty <= 0) return 0;

  return price / usableQty;
}

type Language = AdminLanguage;

const text: Record<Language, Record<string, string>> = {
  fa: {
    dir: "rtl",
    title: "رسپی و قیمت تمام‌شده",
    subtitle: "مدیریت مواد اولیه، آماده‌سازی‌ها، آیتم‌های منو و محاسبه واقعی قیمت تمام‌شده.",
    prepItems: "آماده‌سازی‌ها",
    prepItemCount: "تعداد آماده‌سازی",
    prepItemForm: "ثبت آماده‌سازی",
    savePrepItem: "ذخیره آماده‌سازی",
    updatePrepItem: "به‌روزرسانی آماده‌سازی",
    outputQty: "مقدار خروجی نهایی",
    ingredientCount: "مواد اولیه",
    menuItemCount: "آیتم‌های منو",
    lowMargin: "کم‌سود",
    averageCost: "میانگین هزینه",
    ingredientForm: "ثبت ماده اولیه",
    menuItemForm: "ثبت آیتم منو",
    addComponent: "افزودن ماده به رسپی",
    costReport: "گزارش قیمت تمام‌شده",
    ingredients: "مواد اولیه",
    menuItems: "آیتم‌های منو",
    name: "نام",
    category: "دسته‌بندی",
    unit: "واحد مصرف",
    purchaseQty: "مقدار خرید به واحد مصرف",
    purchasePrice: "قیمت خرید OMR",
    wastePercent: "ضایعات %",
    salePrice: "قیمت فروش OMR",
    targetProfit: "سود هدف %",
    notes: "یادداشت",
    costPerUnit: "هزینه هر واحد",
    recipeCost: "هزینه رسپی",
    profit: "سود",
    margin: "مارجین",
    foodCost: "فودکاست",
    status: "وضعیت",
    good: "خوب",
    watch: "بررسی",
    danger: "خطر",
    saveIngredient: "ذخیره ماده",
    updateIngredient: "به‌روزرسانی ماده",
    saveMenuItem: "ذخیره آیتم",
    updateMenuItem: "به‌روزرسانی آیتم",
    selectIngredient: "انتخاب ماده",
    qty: "مقدار مصرف",
    add: "اضافه کن",
    search: "جستجو",
    edit: "ویرایش",
    remove: "حذف",
    clear: "پاک کردن",
    exportCsv: "خروجی CSV",
    print: "چاپ",
    noData: "هنوز داده‌ای ثبت نشده.",
    live: "محاسبه زنده",
    components: "مواد تشکیل‌دهنده",
  },
  ar: {
    dir: "rtl",
    title: "الوصفات والتكلفة",
    subtitle: "إدارة المواد الخام، التحضيرات، عناصر المنيو وحساب التكلفة الفعلية.",
    prepItems: "التحضيرات",
    prepItemCount: "عدد التحضيرات",
    prepItemForm: "تسجيل تحضير",
    savePrepItem: "حفظ التحضير",
    updatePrepItem: "تحديث التحضير",
    outputQty: "كمية الناتج النهائي",
    ingredientCount: "المواد",
    menuItemCount: "عناصر المنيو",
    lowMargin: "هامش منخفض",
    averageCost: "متوسط التكلفة",
    ingredientForm: "تسجيل مادة",
    menuItemForm: "تسجيل عنصر منيو",
    addComponent: "إضافة مادة للوصفة",
    costReport: "تقرير التكلفة",
    ingredients: "المواد",
    menuItems: "عناصر المنيو",
    name: "الاسم",
    category: "الفئة",
    unit: "وحدة الاستخدام",
    purchaseQty: "كمية الشراء بوحدة الاستخدام",
    purchasePrice: "سعر الشراء OMR",
    wastePercent: "الهدر %",
    salePrice: "سعر البيع OMR",
    targetProfit: "الربح المستهدف %",
    notes: "ملاحظات",
    costPerUnit: "تكلفة الوحدة",
    recipeCost: "تكلفة الوصفة",
    profit: "الربح",
    margin: "الهامش",
    foodCost: "تكلفة الطعام",
    status: "الحالة",
    good: "جيد",
    watch: "مراجعة",
    danger: "خطر",
    saveIngredient: "حفظ المادة",
    updateIngredient: "تحديث المادة",
    saveMenuItem: "حفظ العنصر",
    updateMenuItem: "تحديث العنصر",
    selectIngredient: "اختر مادة",
    qty: "كمية الاستخدام",
    add: "إضافة",
    search: "بحث",
    edit: "تعديل",
    remove: "حذف",
    clear: "مسح",
    exportCsv: "تصدير CSV",
    print: "طباعة",
    noData: "لا توجد بيانات بعد.",
    live: "حساب مباشر",
    components: "المكونات",
  },
  en: {
    dir: "ltr",
    title: "Recipe Costing",
    subtitle: "Manage raw ingredients, prep items, menu items and real production cost in one operational workspace.",
    prepItems: "Prep items",
    prepItemCount: "Prep items",
    prepItemForm: "Prep item",
    savePrepItem: "Save prep item",
    updatePrepItem: "Update prep item",
    outputQty: "Final output quantity",
    ingredientCount: "Ingredients",
    menuItemCount: "Menu items",
    lowMargin: "Low margin",
    averageCost: "Average cost",
    ingredientForm: "Ingredient",
    menuItemForm: "Menu item",
    addComponent: "Add component",
    costReport: "Cost report",
    ingredients: "Ingredients",
    menuItems: "Menu items",
    name: "Name",
    category: "Category",
    unit: "Usage unit",
    purchaseQty: "Purchase qty in usage unit",
    purchasePrice: "Purchase price OMR",
    wastePercent: "Waste %",
    salePrice: "Sale price OMR",
    targetProfit: "Target profit %",
    notes: "Notes",
    costPerUnit: "Cost per unit",
    recipeCost: "Recipe cost",
    profit: "Profit",
    margin: "Margin",
    foodCost: "Food cost",
    status: "Status",
    good: "Good",
    watch: "Watch",
    danger: "Danger",
    saveIngredient: "Save ingredient",
    updateIngredient: "Update ingredient",
    saveMenuItem: "Save item",
    updateMenuItem: "Update item",
    selectIngredient: "Select ingredient",
    qty: "Qty",
    add: "Add",
    search: "Search",
    edit: "Edit",
    remove: "Remove",
    clear: "Clear",
    exportCsv: "Export CSV",
    print: "Print",
    noData: "No data yet.",
    live: "Live calculation",
    components: "Components",
  },
};

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(numberValue(value));
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

const unitOptions = [
  { value: "g", fa: "گرم", ar: "غرام", en: "g" },
  { value: "ml", fa: "میلی‌لیتر", ar: "مل", en: "ml" },
  { value: "piece", fa: "عدد", ar: "قطعة", en: "piece" },
] as const;

const menuCategoryOptions = [
  { value: "Breakfast", fa: "صبحانه", ar: "فطور", en: "Breakfast" },
  { value: "Brunch", fa: "برانچ", ar: "برانش", en: "Brunch" },
  { value: "Appetizers & Salad", fa: "پیش غذا و سالاد", ar: "مقبلات وسلطات", en: "Appetizers & Salad" },
  { value: "Main Course", fa: "غذای اصلی", ar: "طبق رئيسي", en: "Main Course" },
  { value: "Persian Food", fa: "غذای ایرانی", ar: "أكل إيراني", en: "Persian Food" },
  { value: "Sandwich", fa: "ساندویچ", ar: "ساندويتش", en: "Sandwich" },
  { value: "Coffee", fa: "قهوه", ar: "قهوة", en: "Coffee" },
  { value: "Tea", fa: "چای", ar: "شاي", en: "Tea" },
] as const;

function emptyIngredientForm() {
  return {
    id: "",
    name: "",
    category: "Coffee & Bar",
    unit: "g",
    purchaseQty: "",
    purchasePrice: "",
    wastePercent: "0",
    notes: "",
  };
}


function emptyPrepForm() {
  return {
    id: "",
    name: "",
    category: "Prep",
    unit: "g",
    outputQty: "",
    notes: "",
  };
}

function emptyMenuForm() {
  return {
    id: "",
    name: "",
    category: "Coffee",
    salePrice: "",
    targetProfitPercent: "65",
    notes: "",
  };
}

export function RecipeCostingPage({ initialState }: RecipeCostingPageProps) {
  const { language, dir } = useAdminLanguage();
  const t = text[language];
  const [message, setMessage] = useState<string | null>(initialState.message ?? null);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [prepSearch, setPrepSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm());
  const [prepForm, setPrepForm] = useState(emptyPrepForm());
  const [prepComponents, setPrepComponents] = useState<RecipeComponent[]>([]);
  const [prepComponentDraft, setPrepComponentDraft] = useState({ itemId: "", qty: "" });
  const [menuForm, setMenuForm] = useState(emptyMenuForm());
  const [components, setComponents] = useState<RecipeComponent[]>([]);
  const [componentDraft, setComponentDraft] = useState({ itemId: "", qty: "" });

  const filteredCosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return initialState.recipeCosts;

    return initialState.recipeCosts.filter((row) =>
      [row.name, row.category, row.status].join(" ").toLowerCase().includes(normalized),
    );
  }, [initialState.recipeCosts, query]);

  const filteredIngredients = useMemo(() => {
    const q = ingredientSearch.trim().toLowerCase();
    return q ? initialState.ingredients.filter((item) => [item.name, item.category].join(" ").toLowerCase().includes(q)) : initialState.ingredients;
  }, [initialState.ingredients, ingredientSearch]);

  const filteredPrepItems = useMemo(() => {
    const q = prepSearch.trim().toLowerCase();
    return q ? initialState.prepItems.filter((item) => [item.name, item.category].join(" ").toLowerCase().includes(q)) : initialState.prepItems;
  }, [initialState.prepItems, prepSearch]);

  const filteredMenuItems = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    return q ? initialState.menuItems.filter((item) => [item.name, item.category].join(" ").toLowerCase().includes(q)) : initialState.menuItems;
  }, [initialState.menuItems, menuSearch]);

  const itemMap = useMemo(() => {
    return new Map([...initialState.ingredients, ...initialState.prepItems].map((item) => [item.id, item]));
  }, [initialState.ingredients, initialState.prepItems]);

  const unitCostFor = (itemId: string, path = new Set<string>()): number => {
    const item = itemMap.get(itemId);
    if (!item || path.has(itemId)) return 0;
    if (item.itemType === "ingredient") return ingredientUnitCost(item);
    const nextPath = new Set(path);
    nextPath.add(itemId);
    const batchCost = item.components.reduce((sum, component) => sum + unitCostFor(component.itemId, nextPath) * numberValue(component.qty), 0);
    const outputQty = numberValue(item.purchaseQty);
    return outputQty > 0 ? batchCost / outputQty : 0;
  };

  const liveIngredientCost = ingredientUnitCost({
    purchaseQty: ingredientForm.purchaseQty,
    purchasePrice: ingredientForm.purchasePrice,
    wastePercent: ingredientForm.wastePercent,
  });

  const liveRecipeCost = components.reduce((sum, component) => {
    return sum + unitCostFor(component.itemId) * numberValue(component.qty);
  }, 0);
  const livePrepBatchCost = prepComponents.reduce((sum, component) => sum + unitCostFor(component.itemId) * numberValue(component.qty), 0);
  const livePrepUnitCost = numberValue(prepForm.outputQty) > 0 ? livePrepBatchCost / numberValue(prepForm.outputQty) : 0;
  const liveSalePrice = numberValue(menuForm.salePrice);
  const liveProfit = liveSalePrice - liveRecipeCost;
  const liveMargin = liveSalePrice > 0 ? (liveProfit / liveSalePrice) * 100 : 0;
  const liveFoodCost = liveSalePrice > 0 ? (liveRecipeCost / liveSalePrice) * 100 : 0;

  const submitIngredient = () => {
    startTransition(async () => {
      const result = await saveRecipeCostingItem({
        id: ingredientForm.id || null,
        itemType: "ingredient",
        name: ingredientForm.name,
        category: ingredientForm.category,
        unit: ingredientForm.unit,
        purchaseQty: ingredientForm.purchaseQty,
        purchasePrice: ingredientForm.purchasePrice,
        wastePercent: ingredientForm.wastePercent,
        notes: ingredientForm.notes,
      });

      setMessage(result.message ?? null);
      if (result.success) window.location.reload();
    });
  };

  const submitPrepItem = () => {
    startTransition(async () => {
      const result = await saveRecipeCostingItem({
        id: prepForm.id || null,
        itemType: "prep_item",
        name: prepForm.name,
        category: prepForm.category,
        unit: prepForm.unit,
        purchaseQty: prepForm.outputQty,
        purchasePrice: "0",
        wastePercent: "0",
        components: prepComponents,
        notes: prepForm.notes,
      });
      setMessage(result.message ?? null);
      if (result.success) window.location.reload();
    });
  };

  const editPrepItem = (item: RecipeCostingItem) => {
    setPrepForm({ id: item.id, name: item.name, category: item.category, unit: item.unit, outputQty: String(item.purchaseQty ?? ""), notes: item.notes ?? "" });
    setPrepComponents(item.components ?? []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addPrepComponent = () => {
    const qty = numberValue(prepComponentDraft.qty);
    if (!prepComponentDraft.itemId || qty <= 0) return;
    setPrepComponents((current) => current.some((x) => x.itemId === prepComponentDraft.itemId)
      ? current.map((x) => x.itemId === prepComponentDraft.itemId ? { ...x, qty: numberValue(x.qty) + qty } : x)
      : [...current, { itemId: prepComponentDraft.itemId, qty }]);
    setPrepComponentDraft({ itemId: "", qty: "" });
  };

  const submitMenuItem = () => {
    startTransition(async () => {
      const result = await saveRecipeCostingItem({
        id: menuForm.id || null,
        itemType: "menu_item",
        name: menuForm.name,
        category: menuForm.category,
        unit: "piece",
        salePrice: menuForm.salePrice,
        targetProfitPercent: menuForm.targetProfitPercent,
        components,
        notes: menuForm.notes,
      });

      setMessage(result.message ?? null);
      if (result.success) window.location.reload();
    });
  };

  const editIngredient = (item: RecipeCostingItem) => {
    setIngredientForm({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      purchaseQty: String(item.purchaseQty ?? ""),
      purchasePrice: String(item.purchasePrice ?? ""),
      wastePercent: String(item.wastePercent ?? "0"),
      notes: item.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editMenuItem = (item: RecipeCostingItem) => {
    setMenuForm({
      id: item.id,
      name: item.name,
      category: item.category,
      salePrice: String(item.salePrice ?? ""),
      targetProfitPercent: String(item.targetProfitPercent ?? "65"),
      notes: item.notes ?? "",
    });
    setComponents(item.components ?? []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addComponent = () => {
    const qty = numberValue(componentDraft.qty);
    if (!componentDraft.itemId || qty <= 0) return;

    setComponents((current) => {
      const existing = current.find((row) => row.itemId === componentDraft.itemId);
      if (existing) {
        return current.map((row) =>
          row.itemId === componentDraft.itemId ? { ...row, qty: numberValue(row.qty) + qty } : row,
        );
      }

      return [...current, { itemId: componentDraft.itemId, qty }];
    });
    setComponentDraft({ itemId: "", qty: "" });
  };

  const exportCsv = () => {
    const rows = [
      ["Name", "Category", "Sale Price", "Recipe Cost", "Profit", "Margin %", "Food Cost %", "Status"],
      ...filteredCosts.map((row) => [
        row.name,
        row.category,
        row.salePrice.toFixed(3),
        row.recipeCost.toFixed(3),
        row.grossProfit.toFixed(3),
        row.marginPercent.toFixed(1),
        row.foodCostPercent.toFixed(1),
        row.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "recipe-costing.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="space-y-6"
      dir={dir}
      lang={language}
      style={{ fontFamily: language === "fa" ? "var(--font-persian)" : undefined }}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-module-section="recipe-kpis">
        <Card className="p-5">
          <p className="text-sm text-white/45">{t.ingredientCount}</p>
          <p className="mt-3 text-3xl font-black text-white">{initialState.summary.ingredientCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-white/45">{t.prepItemCount}</p>
          <p className="mt-3 text-3xl font-black text-white">{initialState.summary.prepItemCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-white/45">{t.menuItemCount}</p>
          <p className="mt-3 text-3xl font-black text-white">{initialState.summary.menuItemCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-white/45">{t.averageCost}</p>
          <p className="mt-3 text-3xl font-black text-white">{money(initialState.summary.averageCost)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-white/45">{t.lowMargin}</p>
          <p className="mt-3 text-3xl font-black text-white">{initialState.summary.lowMarginCount}</p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Package className="h-5 w-5 text-amber-200" />
            {t.ingredientForm}
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.name} value={ingredientForm.name} onChange={(event) => setIngredientForm((current) => ({ ...current, name: event.target.value }))} />
            <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.category} value={ingredientForm.category} onChange={(event) => setIngredientForm((current) => ({ ...current, category: event.target.value }))} />
            <select className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" value={ingredientForm.unit} onChange={(event) => setIngredientForm((current) => ({ ...current, unit: event.target.value }))}>{unitOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}</select>
            <input type="number" step="0.001" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.purchaseQty} value={ingredientForm.purchaseQty} onChange={(event) => setIngredientForm((current) => ({ ...current, purchaseQty: event.target.value }))} />
            <input type="number" step="0.001" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.purchasePrice} value={ingredientForm.purchasePrice} onChange={(event) => setIngredientForm((current) => ({ ...current, purchasePrice: event.target.value }))} />
            <input type="number" step="0.01" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.wastePercent} value={ingredientForm.wastePercent} onChange={(event) => setIngredientForm((current) => ({ ...current, wastePercent: event.target.value }))} />
            <textarea className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none md:col-span-2" placeholder={t.notes} value={ingredientForm.notes} onChange={(event) => setIngredientForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            {t.live}: {t.costPerUnit} = <span className="font-black text-white">{money(liveIngredientCost)} OMR / {ingredientForm.unit || "unit"}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={submitIngredient} disabled={isPending || !ingredientForm.name.trim()}>
              <Save className="h-4 w-4" />
              {ingredientForm.id ? t.updateIngredient : t.saveIngredient}
            </Button>
            <Button variant="secondary" onClick={() => setIngredientForm(emptyIngredientForm())}>{t.clear}</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Calculator className="h-5 w-5 text-amber-200" />
            {t.menuItemForm}
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.name} value={menuForm.name} onChange={(event) => setMenuForm((current) => ({ ...current, name: event.target.value }))} />
            <select className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" value={menuForm.category} onChange={(event) => setMenuForm((current) => ({ ...current, category: event.target.value }))}>{menuCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}</select>
            <input type="number" step="0.001" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.salePrice} value={menuForm.salePrice} onChange={(event) => setMenuForm((current) => ({ ...current, salePrice: event.target.value }))} />
            <input type="number" step="0.01" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.targetProfit} value={menuForm.targetProfitPercent} onChange={(event) => setMenuForm((current) => ({ ...current, targetProfitPercent: event.target.value }))} />
            <textarea className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none md:col-span-2" placeholder={t.notes} value={menuForm.notes} onChange={(event) => setMenuForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-sm font-bold text-white">{t.addComponent}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_130px_84px_auto]">
              <select className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" value={componentDraft.itemId} onChange={(event) => setComponentDraft((current) => ({ ...current, itemId: event.target.value }))}>
                <option value="">{t.selectIngredient}</option>
                {[...initialState.ingredients, ...initialState.prepItems].map((item) => (
                  <option key={item.id} value={item.id}>{item.name} / {money(unitCostFor(item.id))} per {item.unit}</option>
                ))}
              </select>
              <input type="number" step="0.001" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.qty} value={componentDraft.qty} onChange={(event) => setComponentDraft((current) => ({ ...current, qty: event.target.value }))} />
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white/60">{itemMap.get(componentDraft.itemId)?.unit ?? "—"}</div>
              <Button onClick={addComponent} disabled={!componentDraft.itemId || !componentDraft.qty}><Plus className="h-4 w-4" />{t.add}</Button>
            </div>

            <div className="mt-4 space-y-2">
              {components.map((component) => {
                const item = itemMap.get(component.itemId);
                const cost = unitCostFor(component.itemId) * numberValue(component.qty);

                return (
                  <div key={component.itemId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                    <span className="text-white/70">{item?.name ?? "—"} × {component.qty} {item?.unit ?? ""}</span>
                    <span className="font-bold text-white">{money(cost)}</span>
                    <button type="button" className="text-red-200" onClick={() => setComponents((current) => current.filter((row) => row.itemId !== component.itemId))}>{t.remove}</button>
                  </div>
                );
              })}
              {components.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-white/40">{t.recipeCost}</p><p className="mt-1 font-black text-white">{money(liveRecipeCost)}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-white/40">{t.profit}</p><p className="mt-1 font-black text-white">{money(liveProfit)}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-white/40">{t.margin}</p><p className="mt-1 font-black text-white">{percent(liveMargin)}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-white/40">{t.foodCost}</p><p className="mt-1 font-black text-white">{percent(liveFoodCost)}</p></div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={submitMenuItem} disabled={isPending || !menuForm.name.trim()}>
              <Save className="h-4 w-4" />
              {menuForm.id ? t.updateMenuItem : t.saveMenuItem}
            </Button>
            <Button variant="secondary" onClick={() => { setMenuForm(emptyMenuForm()); setComponents([]); }}>{t.clear}</Button>
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white"><Calculator className="h-5 w-5 text-amber-200" />{t.prepItemForm}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.name} value={prepForm.name} onChange={(event) => setPrepForm((current) => ({ ...current, name: event.target.value }))} />
          <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.category} value={prepForm.category} onChange={(event) => setPrepForm((current) => ({ ...current, category: event.target.value }))} />
          <select className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" value={prepForm.unit} onChange={(event) => setPrepForm((current) => ({ ...current, unit: event.target.value }))}>{unitOptions.map((option) => <option key={option.value} value={option.value}>{option[language]}</option>)}</select>
          <input type="number" step="0.001" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.outputQty} value={prepForm.outputQty} onChange={(event) => setPrepForm((current) => ({ ...current, outputQty: event.target.value }))} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_84px_auto]">
          <select className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" value={prepComponentDraft.itemId} onChange={(event) => setPrepComponentDraft((current) => ({ ...current, itemId: event.target.value }))}>
            <option value="">{t.selectIngredient}</option>
            {[...initialState.ingredients, ...initialState.prepItems.filter((item) => item.id !== prepForm.id)].map((item) => <option key={item.id} value={item.id}>{item.name} / {money(unitCostFor(item.id))} per {item.unit}</option>)}
          </select>
          <input type="number" step="0.001" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.qty} value={prepComponentDraft.qty} onChange={(event) => setPrepComponentDraft((current) => ({ ...current, qty: event.target.value }))} />
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white/60">{itemMap.get(prepComponentDraft.itemId)?.unit ?? "—"}</div>
          <Button onClick={addPrepComponent} disabled={!prepComponentDraft.itemId || !prepComponentDraft.qty}><Plus className="h-4 w-4" />{t.add}</Button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">{prepComponents.map((component) => { const item=itemMap.get(component.itemId); return <div key={component.itemId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm"><span className="text-white/70">{item?.name ?? "—"} × {component.qty} {item?.unit ?? ""}</span><span className="font-bold text-white">{money(unitCostFor(component.itemId)*numberValue(component.qty))}</span><button type="button" className="text-red-200" onClick={() => setPrepComponents((current) => current.filter((row) => row.itemId !== component.itemId))}>{t.remove}</button></div>; })}</div>
        <div className="mt-4 rounded-2xl border border-amber-200/15 bg-amber-200/[0.06] p-4 text-sm text-white/60">Batch cost: <b className="text-white">{money(livePrepBatchCost)} OMR</b> · {t.costPerUnit}: <b className="text-white">{money(livePrepUnitCost)} OMR / {prepForm.unit || "unit"}</b></div>
        <textarea className="mt-4 min-h-20 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.notes} value={prepForm.notes} onChange={(event) => setPrepForm((current) => ({ ...current, notes: event.target.value }))} />
        <div className="mt-4 flex gap-3"><Button onClick={submitPrepItem} disabled={isPending || !prepForm.name.trim() || !prepForm.outputQty}><Save className="h-4 w-4" />{prepForm.id ? t.updatePrepItem : t.savePrepItem}</Button><Button variant="secondary" onClick={() => { setPrepForm(emptyPrepForm()); setPrepComponents([]); }}>{t.clear}</Button></div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-xl font-semibold text-white">{t.costReport}</h2>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-white/40">
              <Search className="h-4 w-4" />
              <input className="bg-transparent text-sm text-white outline-none" placeholder={t.search} value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" />{t.exportCsv}</Button>
            <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />{t.print}</Button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-white/40">
              <tr>
                <th className="px-4 py-3">{t.name}</th>
                <th className="px-4 py-3">{t.category}</th>
                <th className="px-4 py-3">{t.recipeCost}</th>
                <th className="px-4 py-3">{t.salePrice}</th>
                <th className="px-4 py-3">{t.margin}</th>
                <th className="px-4 py-3">{t.foodCost}</th>
                <th className="px-4 py-3">{t.status}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCosts.map((row) => {
                const item = initialState.menuItems.find((menuItem) => menuItem.id === row.itemId);

                return (
                  <tr key={row.itemId} className="text-white/70">
                    <td className="px-4 py-4 font-bold text-white">{row.name}</td>
                    <td className="px-4 py-4">{row.category}</td>
                    <td className="px-4 py-4">{money(row.recipeCost)}</td>
                    <td className="px-4 py-4">{money(row.salePrice)}</td>
                    <td className="px-4 py-4">{percent(row.marginPercent)}</td>
                    <td className="px-4 py-4">{percent(row.foodCostPercent)}</td>
                    <td className="px-4 py-4">{t[row.status]}</td>
                    <td className="px-4 py-4 text-right">
                      {item && <button type="button" onClick={() => editMenuItem(item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10">{t.edit}</button>}
                    </td>
                  </tr>
                );
              })}
              {filteredCosts.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-white/35">{t.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-xl font-semibold text-white">{t.ingredients}</h2>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><Search className="h-4 w-4 text-white/35" /><input value={ingredientSearch} onChange={(e) => setIngredientSearch(e.target.value)} placeholder={t.search} className="w-full bg-transparent text-sm text-white outline-none" /></div>
          <div className="mt-5 space-y-2">
            {filteredIngredients.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-xs text-white/35">{item.category} / {money(ingredientUnitCost(item))} per {item.unit}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editIngredient(item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10">{t.edit}</button>
                </div>
              </div>
            ))}
            {filteredIngredients.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-white">{t.prepItems}</h2>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><Search className="h-4 w-4 text-white/35" /><input value={prepSearch} onChange={(e) => setPrepSearch(e.target.value)} placeholder={t.search} className="w-full bg-transparent text-sm text-white outline-none" /></div>
          <div className="mt-5 space-y-2">
            {filteredPrepItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div><p className="font-bold text-white">{item.name}</p><p className="text-xs text-white/35">{item.category} / {money(unitCostFor(item.id))} per {item.unit}</p></div>
                <div className="flex gap-2"><button type="button" onClick={() => editPrepItem(item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10">{t.edit}</button></div>
              </div>
            ))}
            {filteredPrepItems.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-white">{t.menuItems}</h2>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><Search className="h-4 w-4 text-white/35" /><input value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder={t.search} className="w-full bg-transparent text-sm text-white outline-none" /></div>
          <div className="mt-5 space-y-2">
            {filteredMenuItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-xs text-white/35">{item.category} / {item.components.length} {t.components}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editMenuItem(item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10">{t.edit}</button>
                </div>
              </div>
            ))}
            {filteredMenuItems.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
          </div>
        </Card>
      </section>
    </div>
  );
}

export default RecipeCostingPage;
