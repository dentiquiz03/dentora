import { Sparkles } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5">
    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--primary)] text-white shadow-lg shadow-teal-900/10"><Sparkles size={19}/></span>
    {!compact && <div><div className="text-lg font-black tracking-[-.03em]">Dentora</div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Dental Revision</div></div>}
  </div>;
}
