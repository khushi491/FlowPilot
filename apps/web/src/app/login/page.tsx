"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { BrickRow, LegoStud } from "@/components/ui/LegoStud";

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
    <div className="flex min-h-screen items-center justify-center lego-studs-blue px-4 py-10">
      <form onSubmit={onSubmit} className="panel w-full max-w-md bg-lego-yellow p-6 animate-brick-pop">
        <div className="mb-3 flex items-center gap-2">
          <LegoStud color="red" />
          <div className="font-display text-2xl font-bold">FlowPilot</div>
        </div>
        <BrickRow className="mb-4" />
        <h1 className="font-display text-3xl font-bold text-lego-ink">Click in</h1>
        <p className="mt-1 text-sm font-semibold text-black/70">Sign in to your brick-built workspace.</p>
        {error ? (
          <p className="mt-3 rounded-brick border-[3px] border-black bg-lego-red px-3 py-2 text-sm font-bold text-white">
            {error}
          </p>
        ) : null}
        <label className="mt-4 block text-sm font-bold">
          <span className="mb-1 block">Email</span>
          <input
            className="input-lego"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 block text-sm font-bold">
          <span className="mb-1 block">Password</span>
          <input
            className="input-lego"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button type="submit" className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? "Snapping..." : "Sign in"}
        </button>
        <p className="mt-4 text-center text-sm font-semibold text-black/70">
          No account?{" "}
          <Link href="/signup" className="font-extrabold text-lego-blue underline">
            Build one
          </Link>
        </p>
      </form>
    </div>
  );
}
