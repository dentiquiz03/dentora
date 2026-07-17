import Link from "next/link";
import { Bookmark, Brain, ClipboardList, History, Home, Import, Library, Settings, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import type { Profile } from "@/lib/types";

const learnerNav = [
  ["/dashboard", "Dashboard", Home], ["/practice", "Practice", Brain], ["/review", "Due review", ClipboardList],
  ["/bookmarks", "Bookmarks", Bookmark], ["/history", "History", History],
] as const;
const adminNav = [
  ["/admin", "Admin overview", ShieldCheck], ["/admin/questions", "Question library", Library], ["/admin/import", "Bulk import", Import],
  ["/admin/taxonomy", "Subjects & topics", Settings], ["/admin/users", "Users", Users],
] as const;

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return <div className="min-h-screen md:grid md:grid-cols-[255px_1fr]">
    <aside className="hidden border-r border-slate-200/80 bg-white/85 p-4 backdrop-blur md:flex md:flex-col">
      <div className="px-2 py-2"><Logo/></div>
      <nav className="mt-7 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Revision</p>
        {learnerNav.map(([href,label,Icon])=><Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"><Icon size={18}/>{label}</Link>)}
        {profile.role === "admin" && <><p className="px-3 pb-2 pt-6 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Administration</p>{adminNav.map(([href,label,Icon])=><Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Icon size={18}/>{label}</Link>)}</>}
      </nav>
      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="mb-2 px-3"><p className="truncate text-sm font-bold">{profile.display_name || "Dental learner"}</p><p className="text-xs capitalize text-slate-500">{profile.role}</p></div>
        <LogoutButton/>
      </div>
    </aside>
    <main className="min-w-0"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl md:px-8"><div className="md:hidden"><Logo compact/></div><div className="hidden text-sm font-semibold text-slate-500 md:block">Private revision workspace</div><div className="flex items-center gap-2"><span className="badge bg-emerald-50 text-emerald-700">Synced</span><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">{(profile.display_name || "D").slice(0,1).toUpperCase()}</div></div></header><div className="mx-auto max-w-[1450px] p-4 md:p-8">{children}</div></main>
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur md:hidden">{learnerNav.slice(0,5).map(([href,label,Icon])=><Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold text-slate-500"><Icon size={18}/><span>{label.split(" ")[0]}</span></Link>)}</nav>
  </div>;
}
