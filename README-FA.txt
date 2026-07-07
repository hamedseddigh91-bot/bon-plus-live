Bon Plus - Feedback Settings Navigation Cleanup

این آپدیت فقط منوی Settings را اصلاح می‌کند:
- «فیدبک‌های ثبت‌شده / Feedback Inbox» از Settings حذف می‌شود.
- Feedback Inbox فقط در CRM باقی می‌ماند.
- «سؤال‌های فیدبک / Feedback Questions» در Settings باقی می‌ماند.
- Response & Reward Rules و External Reviews نیز باقی می‌مانند.

هیچ تغییر Supabase، Migration، Table، Policy، Storage، Function یا Environment Variable لازم نیست.

روش نصب:
1) ZIP را در ریشه پروژه Extract کنید.
2) از ریشه پروژه اجرا کنید:
   powershell -ExecutionPolicy Bypass -File .\bon-plus-feedback-settings-cleanup\apply-feedback-settings-cleanup.ps1
3) تست:
   npm run build
4) اگر Build موفق بود:
   git add src/features/admin/settings/settings-shell.tsx
   git commit -m "remove feedback inbox from settings navigation"
   git push origin main
