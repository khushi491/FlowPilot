import Link from "next/link";
import { ArrowRight, Blocks, GitBranch, Radar } from "lucide-react";
import { BrickRow, LegoStud } from "@/components/ui/LegoStud";

const KITS = [
  {
    id: "resume-reviewer",
    name: "Resume Reviewer",
    blurb: "LLM → Output",
    bricks: ["bg-lego-yellow", "bg-lego-ink"],
  },
  {
    id: "customer-support",
    name: "Support Auto-Reply",
    blurb: "RAG → LLM → Approval → Output",
    bricks: ["bg-lego-green", "bg-lego-yellow", "bg-lego-red", "bg-lego-ink"],
  },
  {
    id: "research-summarizer",
    name: "Research Summarizer",
    blurb: "API → LLM → Output",
    bricks: ["bg-lego-blue", "bg-lego-yellow", "bg-lego-ink"],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-lego-ink text-white">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 lego-studs-red" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
          <header className="flex items-center justify-between animate-brick-pop">
            <div className="flex items-center gap-3">
              <LegoStud color="yellow" className="h-6 w-6 animate-stud-bounce" />
              <div className="font-display text-4xl font-bold tracking-tight drop-shadow-[3px_3px_0_rgba(0,0,0,0.35)]">
                FlowPilot
              </div>
            </div>
            <Link href="/login" className="btn-secondary">
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          <div className="relative mt-20 flex flex-1 flex-col justify-center pb-24 md:mt-28">
            <BrickRow className="mb-6 animate-brick-pop" />
            <h1 className="font-display max-w-3xl text-5xl font-bold leading-[1.05] drop-shadow-[4px_4px_0_rgba(0,0,0,0.35)] md:text-7xl animate-brick-pop">
              Snap AI workflows together like bricks.
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold text-white/90 animate-brick-pop">
              Build LLM agents with drag-and-drop nodes, then click them into place and watch them run.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-brick-pop">
              <Link href="/login" className="btn-secondary">
                Start building
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 rounded-md border-[3px] border-black bg-lego-blue px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-brick-blue transition hover:translate-y-px"
              >
                Browse templates
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-[6px] border-black bg-lego-yellow px-6 py-16 text-lego-ink">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Starter kits</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-black/70">
            Three ready brick sets. Snap one after login and run it on the baseplate.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {KITS.map((kit) => (
              <Link
                key={kit.id}
                href="/templates"
                className="rounded-brick border-[3px] border-black bg-white p-5 shadow-brick transition hover:-translate-y-1"
              >
                <div className="mb-4 flex items-center gap-2">
                  {kit.bricks.map((color, idx) => (
                    <div key={`${kit.id}-${idx}`} className="flex items-center gap-2">
                      <div className={`h-8 w-14 rounded-brick border-[3px] border-black ${color}`} />
                      {idx < kit.bricks.length - 1 ? (
                        <span className="text-xs font-extrabold text-black/40">→</span>
                      ) : null}
                    </div>
                  ))}
                </div>
                <h3 className="font-display text-xl font-bold">{kit.name}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-black/55">{kit.blurb}</p>
                <span className="mt-4 inline-flex text-sm font-extrabold text-lego-blue">Snap this kit →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="lego-studs border-t-[6px] border-black px-6 py-16 text-lego-ink">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {[
            {
              icon: GitBranch,
              title: "Brick builder",
              text: "Snap prompt, API, RAG, and approval bricks into a runnable graph.",
              color: "bg-lego-yellow",
            },
            {
              icon: Radar,
              title: "Live traces",
              text: "Watch each brick light up with status, retries, tokens, and cost.",
              color: "bg-lego-blue text-white",
            },
            {
              icon: Blocks,
              title: "RAG blocks",
              text: "Upload docs, chunk them, and click retrieval into your LLM brick.",
              color: "bg-lego-green text-white",
            },
          ].map(({ icon: Icon, title, text, color }) => (
            <div key={title} className={`rounded-brick border-[3px] border-black p-5 shadow-brick ${color}`}>
              <div className="mb-3 flex gap-1.5">
                <LegoStud color="red" className="h-3.5 w-3.5" />
                <LegoStud color="yellow" className="h-3.5 w-3.5" />
                <LegoStud color="blue" className="h-3.5 w-3.5" />
              </div>
              <Icon className="h-6 w-6" />
              <h2 className="mt-3 font-display text-2xl font-bold">{title}</h2>
              <p className="mt-2 text-sm font-semibold opacity-90">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
