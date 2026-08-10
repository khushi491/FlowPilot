import { AlertTriangle } from "lucide-react";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-brick border-[3px] border-black bg-lego-red px-5 py-6 text-white shadow-brick-red">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-display text-xl font-bold">Brick dropped</h3>
          <p className="mt-1 text-sm font-semibold text-white/90">
            {message || "An unexpected error occurred. Check your connection and try again."}
          </p>
          {onRetry ? (
            <button type="button" onClick={onRetry} className="btn-secondary mt-4">
              Rebuild
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
