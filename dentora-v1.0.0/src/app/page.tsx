import { redirect } from "next/navigation";
import Link from "next/link";
import { Database, LockKeyhole, Smartphone, Sparkles, type LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/logo";

const features: Array<[LucideIcon, string, string]> = [
  [LockKeyhole, "Private access", "Only the administrator and invited learner can sign in."],
  [Database, "Secure question bank", "Supabase stores questions, attempts and revision history."],
  [Smartphone, "Phone and laptop", "Responsive and installable as a home-screen app."],
  [Sparkles, "Built for revision", "Practice, exams, weak-topic review and analytics."],
];

export default async function Home() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (configured) { const user = await getCurrentUser(); redirect(user ? "/dashboard" : "/login"); }
  return <main className="min-h-screen p-5 md:p-10"><div className="mx-auto max-w-6xl"><Logo/><section className="grid min-h-[80vh] items-center gap-10 py-14 md:grid-cols-2"><div><span className="badge bg-[var(--primary-soft)] text-[var(--primary)]">Application files ready</span><h1 className="mt-5 text-5xl font-black leading-[.98] tracking-[-.055em] md:text-7xl">Your private dental revision space.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Dentora is installed correctly, but it still needs the two Supabase environment values described in the setup guide.</p><div className="mt-8 flex gap-3"><Link href="/SETUP.md" className="btn btn-primary">Open setup guide</Link></div></div><div className="card p-6 md:p-8"><div className="grid gap-4">{features.map(([Icon,title,text])=><div key={String(title)} className="flex gap-4 rounded-2xl border border-slate-100 p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100"><Icon size={20}/></span><div><h2 className="font-black">{String(title)}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{String(text)}</p></div></div>)}</div></div></section></div></main>;
}
