export default function SettingsLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading settings">
      <div className="h-16 animate-pulse rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)]" />
      <div className="h-28 animate-pulse rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)]" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)]" />
        <div className="h-56 animate-pulse rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)]" />
      </div>
    </div>
  );
}
