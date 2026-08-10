export function LoadingState({ label = "Stacking bricks..." }: { label?: string }) {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <div className="h-5 w-48 animate-pulse rounded-brick border-[3px] border-black bg-lego-yellow" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-brick border-[3px] border-black bg-lego-red/80" />
        <div className="h-24 animate-pulse rounded-brick border-[3px] border-black bg-lego-blue/80" />
        <div className="h-24 animate-pulse rounded-brick border-[3px] border-black bg-lego-green/80" />
      </div>
      <div className="h-48 animate-pulse rounded-brick border-[3px] border-black bg-white" />
      <p className="text-sm font-bold uppercase tracking-wide text-black/60">{label}</p>
    </div>
  );
}
