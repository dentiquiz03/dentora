export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-[var(--primary)]">{eyebrow}</p>}<h1 className="text-3xl font-black tracking-[-.04em] text-slate-900 md:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">{description}</p>}</div>{action}</div>;
}
