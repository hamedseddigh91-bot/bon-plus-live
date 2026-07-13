export default function FeedbackLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#06070a] px-6 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-amber-300" />
        <p className="mt-4 text-sm font-medium text-white/70">Loading feedback form...</p>
      </div>
    </main>
  );
}
