-- Bon Plus finance is now date-driven.
-- Historical finance_periods / finance_opening_entries rows are intentionally preserved.
-- Only the closed-period write guards are removed so finance entries and cash closings
-- are controlled by record date and the app's normal permissions instead of period state.

drop trigger if exists trg_finance_entries_closed_period_guard on public.finance_entries;
drop trigger if exists trg_cash_closings_closed_period_guard on public.cash_closings;
