"use client";

export function PaginationControls({
  total,
  limit,
  offset,
  onChange,
}: {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
}) {
  if (total <= limit) return null;
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  const prev = Math.max(0, offset - limit);
  const next = offset + limit;

  return (
    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
      <span>
        Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={offset <= 0}
          onClick={() => onChange(prev)}
        >
          Previous
        </button>
        <span className="text-xs text-slate-500">
          Page {page} / {pages}
        </span>
        <button
          type="button"
          className="btn-secondary"
          disabled={next >= total}
          onClick={() => onChange(next)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
