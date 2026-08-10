"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { BrickRow, LegoStud } from "@/components/ui/LegoStud";

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
    <div className="flex min-h-screen items-center justify-center lego-studs-red px-4 py-10">
      <form onSubmit={onSubmit} className="panel w-full max-w-md bg-white p-6 animate-brick-pop">
        <div className="mb-3 flex items-center gap-2">
          <LegoStud color="yellow" />
          <div className="font-display text-2xl font-bold">FlowPilot</div>
        </div>
        <BrickRow className="mb-4" />
        <h1 className="font-display text-3xl font-bold text-lego-ink">Build your account</h1>
        <p className="mt-1 text-sm font-semibold text-black/70">Start snapping AI agent workflows in minutes.</p>
        {error ? (
          <p className="mt-3 rounded-brick border-[3px] border-black bg-lego-red px-3 py-2 text-sm font-bold text-white">
            {error}
          </p>
        ) : null}
        <label className="mt-4 block text-sm font-bold">
          <span className="mb-1 block">Full name</span>
          <input className="input-lego" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-bold">
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
          {loading ? "Building..." : "Sign up"}
        </button>
        <p className="mt-4 text-center text-sm font-semibold text-black/70">
          Already have bricks?{" "}
          <Link href="/login" className="font-extrabold text-lego-blue underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
