export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-40 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
        <div className="h-32 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
        <div className="h-32 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
        <div className="h-32 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
      </div>
    </div>
  );
}
