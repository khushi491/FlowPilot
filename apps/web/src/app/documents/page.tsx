"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { api, DocumentItem } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setDocs(await api.listDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onUpload = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadDocument(file);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <DashboardShell
      title="Documents"
      subtitle="Upload knowledge files for RAG retrieval nodes."
      actions={
        <label className="btn-primary cursor-pointer">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload"}
          <input
            type="file"
            className="hidden"
            accept=".txt,.md,.pdf,text/plain,application/pdf"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files?.[0])}
          />
        </label>
      }
    >
      {loading ? <LoadingState label="Loading documents..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Add text or PDF files to power RAG search nodes in your workflows."
        />
      ) : null}
      {!loading && !error && docs.length > 0 ? (
        <div className="panel overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Chunks</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{doc.filename}</td>
                  <td className="px-4 py-3 text-slate-600">{formatBytes(doc.size_bytes)}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.chunk_count}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                      onClick={() => void onDelete(doc.id)}
                      aria-label={`Delete ${doc.filename}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </DashboardShell>
  );
}
