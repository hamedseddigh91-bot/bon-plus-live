export default function AdminLoading() {
  return (
    <div className="bp-route-loading space-y-5" aria-busy="true" aria-label="Loading page">
      <div className="h-1 overflow-hidden rounded-full bg-[color:var(--admin-soft)]">
        <div className="bp-route-progress h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)]" />
        <div className="h-28 animate-pulse rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)]" />
        <div className="h-28 animate-pulse rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)]" />
      </div>
      <div className="h-80 animate-pulse rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)]" />
    </div>
  );
}
