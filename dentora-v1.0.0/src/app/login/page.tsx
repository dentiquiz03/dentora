import { redirect } from "next/navigation";
import { BookOpenCheck, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };
export default async function LoginPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/");
  const user=await getCurrentUser(); if(user) redirect("/dashboard");
  return <main className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]"><section className="hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col"><Logo/><div className="my-auto max-w-xl"><span className="badge bg-white/10 text-teal-200">Focused dental revision</span><h1 className="mt-6 text-6xl font-black leading-[1.02] tracking-[-.055em]">Turn every question into lasting knowledge.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Target weak topics, review mistakes and watch your confidence grow over time.</p><div className="mt-10 grid grid-cols-2 gap-4"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><BookOpenCheck className="text-teal-300"/><p className="mt-6 font-bold">Structured practice</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="text-violet-300"/><p className="mt-6 font-bold">Private by design</p></div></div></div></section><section className="flex items-center justify-center p-5 md:p-10"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><Logo/></div><div className="card p-6 md:p-9"><p className="text-xs font-black uppercase tracking-[.16em] text-[var(--primary)]">Welcome back</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Sign in to Dentora</h2><p className="mb-7 mt-2 text-sm leading-6 text-slate-500">Use the private account created for you.</p><LoginForm/></div></div></section></main>;
}
