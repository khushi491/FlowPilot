"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("demo@flowpilot.dev");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace(params.get("next") || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#134e4a,_#0f1c24_70%)] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="font-display text-3xl text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to your FlowPilot workspace.</p>
        {error ? <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-slate-600">Email</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-slate-600">Password</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button type="submit" className="btn-primary mt-5 w-full justify-center" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-600">
          No account?{" "}
          <Link href="/signup" className="text-teal-700 hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
