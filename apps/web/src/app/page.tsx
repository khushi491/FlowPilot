import Link from "next/link";
import { ArrowRight, GitBranch, Radar, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#134e4a_0%,_#0f1c24_55%,_#081016_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="font-display text-3xl tracking-tight">FlowPilot</div>
          <Link href="/login" className="btn-primary bg-orange-600 hover:bg-orange-700">
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="relative mt-16 flex flex-1 flex-col justify-center pb-20">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,transparent_0%,rgba(45,212,191,0.12)_40%,transparent_70%)]" />
          <p className="mb-4 inline-flex w-fit items-center gap-2 text-sm text-teal-200">
            <Sparkles className="h-4 w-4" />
            Visual AI-agent orchestration
          </p>
          <h1 className="font-display max-w-3xl text-5xl leading-tight md:text-6xl">
            Design LLM workflows you can run, watch, and trust.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Drag-and-drop nodes for prompts, APIs, RAG retrieval, approvals, and branching logic —
            then execute with live traces and cost visibility.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/workflows" className="btn-primary bg-teal-500 hover:bg-teal-400 text-slate-950">
              Build a workflow
            </Link>
            <Link href="/templates" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/15">
              Browse templates
            </Link>
          </div>
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              { icon: GitBranch, title: "Graph builder", text: "Compose agent steps visually with React Flow." },
              { icon: Radar, title: "Live observability", text: "Stream node status, retries, tokens, and cost." },
              { icon: Sparkles, title: "RAG-ready", text: "Upload docs, embed chunks, retrieve context." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Icon className="h-5 w-5 text-teal-300" />
                <h2 className="mt-3 font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
