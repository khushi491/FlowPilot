"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signup(email, password, fullName);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#134e4a,_#0f1c24_70%)] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="font-display text-3xl text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">Start building AI agent workflows in minutes.</p>
        {error ? <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-slate-600">Full name</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm">
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
          {loading ? "Creating..." : "Sign up"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
