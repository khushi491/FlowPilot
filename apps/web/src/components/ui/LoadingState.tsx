export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
