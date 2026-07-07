Bon Plus - Feedback Navigation Update

این آپدیت فقط Navigation رابط کاربری را تغییر می‌دهد و هیچ تغییر Supabase، Migration، Table، Policy، Storage، Function یا Environment Variable ندارد.

نتیجه:
- Feedback Inbox
- Feedback Questions
- Response & Reward Rules
- External Reviews

همگی از منوی Settings قابل دسترسی می‌شوند.

روش نصب:
1) فایل ZIP را در ریشه پروژه Extract کنید.
2) PowerShell را در ریشه پروژه باز کنید.
3) اجرا کنید:
   powershell -ExecutionPolicy Bypass -File .\bon-plus-feedback-nav\apply-feedback-navigation.ps1
4) تست:
   npm run build
5) در صورت موفقیت:
   git add src/features/admin/settings/settings-shell.tsx
   git commit -m "improve feedback navigation access"
   git push origin main
