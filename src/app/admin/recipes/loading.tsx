export default function RecipesLoading() {
  return (
    <div className="space-y-5">
      <div className="h-36 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="h-28 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.04]" />
        <div className="h-28 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.04]" />
        <div className="h-28 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.04]" />
        <div className="h-28 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.04]" />
      </div>
      <div className="h-96 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
    </div>
  );
}
