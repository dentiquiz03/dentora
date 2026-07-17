"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Loader2,
  Menu,
  XCircle,
} from "lucide-react";
import type { SessionPayload } from "@/lib/types";

interface Result {
  is_correct: boolean | null;
  correct_option_ids: string[];
  explanation: string | null;
  learning_point: string | null;
  reference_text: string | null;
  answered_count: number;
  total_count: number;
  reveal: boolean;
}

export function SessionPlayer({ initial }: { initial: SessionPayload }) {
  const router = useRouter();
  const initialIndex = Math.max(0, (initial.session.current_position || 1) - 1);
  const [questions, setQuestions] = useState(initial.questions);
  const [index, setIndex] = useState(initialIndex);
  const [selected, setSelected] = useState<string[]>(initial.questions[initialIndex]?.selected_option_ids || []);
  const [confidence, setConfidence] = useState(3);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef<number>(0);

  const q = questions[index];
  const isMulti = q?.question_type === "multiple_select";
  const answered = Boolean(q?.answered);
  const answeredCount = questions.filter((item) => item.answered).length;

  const navigateTo = useCallback(
    (nextIndex: number) => {
      const next = questions[nextIndex];
      if (!next) return;
      setIndex(nextIndex);
      setSelected(next.selected_option_ids || []);
      setResult(null);
      started.current = Date.now();
    },
    [questions],
  );

  useEffect(() => {
    started.current = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(initial.session.started_at).getTime()) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [initial.session.started_at]);

  const remaining = useMemo(
    () =>
      initial.session.time_limit_minutes
        ? Math.max(0, initial.session.time_limit_minutes * 60 - elapsed)
        : null,
    [elapsed, initial.session.time_limit_minutes],
  );

  const finish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    const response = await fetch(`/api/sessions/${initial.session.id}/complete`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) {
      alert(json.error || "Could not complete session");
      setFinishing(false);
      return;
    }
    router.push(`/practice/results/${initial.session.id}`);
    router.refresh();
  }, [finishing, initial.session.id, router]);

  useEffect(() => {
    if (remaining !== 0) return;
    const timeout = window.setTimeout(() => void finish(), 0);
    return () => window.clearTimeout(timeout);
  }, [remaining, finish]);

  function pick(id: string) {
    if (answered || result) return;
    setSelected((current) =>
      isMulti ? (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) : [id],
    );
  }

  async function submit() {
    if (!selected.length || loading) return;
    setLoading(true);
    const seconds = Math.max(1, Math.floor((Date.now() - started.current) / 1000));
    const response = await fetch(`/api/sessions/${initial.session.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: q.id,
        selected_option_ids: selected,
        confidence,
        time_seconds: seconds,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      alert(json.error || "Could not save answer");
      setLoading(false);
      return;
    }

    const updated = questions.map((item) =>
      item.id === q.id ? { ...item, answered: true, selected_option_ids: selected } : item,
    );
    setQuestions(updated);
    setResult(json as Result);
    setLoading(false);

    if (initial.session.mode === "exam" && index < updated.length - 1) {
      window.setTimeout(() => {
        const next = updated[index + 1];
        setIndex(index + 1);
        setSelected(next.selected_option_ids || []);
        setResult(null);
        started.current = Date.now();
      }, 200);
    }
  }

  async function toggleFlag() {
    const response = await fetch(`/api/sessions/${initial.session.id}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: q.id, flagged: !q.flagged }),
    });
    if (response.ok) {
      setQuestions((current) =>
        current.map((item) => (item.id === q.id ? { ...item, flagged: !item.flagged } : item)),
      );
    }
  }

  async function bookmark() {
    await fetch(`/api/questions/${q.id}/bookmark`, { method: "POST" });
  }

  function optionClass(id: string) {
    const chosen = selected.includes(id);
    if (result?.reveal) {
      if (result.correct_option_ids.includes(id)) return "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100";
      if (chosen) return "border-red-400 bg-red-50 ring-2 ring-red-100";
    }
    return chosen
      ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100"
      : "border-slate-200 bg-white hover:border-slate-300";
  }

  if (!q) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="card mb-4 flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.15em] text-[var(--primary)]">
            {initial.session.mode} session
          </p>
          <p className="mt-1 font-black">Question {index + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-slate-100 text-slate-600">{answeredCount}/{questions.length} answered</span>
          {remaining !== null && (
            <span className={`badge ${remaining < 300 ? "bg-red-50 text-red-700" : "bg-violet-50 text-violet-700"}`}>
              <Clock3 size={13} />{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
            </span>
          )}
          <button className="btn btn-secondary !p-2.5" onClick={bookmark} title="Bookmark"><Bookmark size={18} /></button>
          <button className={`btn btn-secondary !p-2.5 ${q.flagged ? "!border-orange-300 !bg-orange-50 !text-orange-700" : ""}`} onClick={toggleFlag} title="Flag"><Flag size={18} /></button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <section className="card p-5 md:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-[var(--primary-soft)] text-[var(--primary)]">{q.subject_name}</span>
            {q.topic_name && <span className="badge bg-slate-100 text-slate-600">{q.topic_name}</span>}
            <span className="badge bg-violet-50 text-violet-700 capitalize">{q.difficulty}</span>
          </div>
          {q.clinical_vignette && <div className="mt-6 rounded-2xl border-l-4 border-violet-400 bg-violet-50/70 p-4 text-sm leading-7 text-slate-700">{q.clinical_vignette}</div>}
          <h1 className="mt-6 text-xl font-black leading-8 tracking-[-.02em] md:text-2xl">{q.stem}</h1>
          <div className="mt-6 space-y-3">
            {q.options.map((option) => (
              <button key={option.id} disabled={answered || Boolean(result)} onClick={() => pick(option.id)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${optionClass(option.id)}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs font-black ${selected.includes(option.id) ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-slate-300 text-slate-500"}`}>
                  {selected.includes(option.id) ? <Check size={15} /> : option.label}
                </span>
                <span className="pt-0.5 text-sm font-semibold leading-6 md:text-base">{option.option_text}</span>
              </button>
            ))}
          </div>

          {!answered && !result && (
            <div className="mt-7 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
              <div><label className="label">Confidence: {confidence}/5</label><input type="range" min="1" max="5" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} className="w-48 accent-[var(--primary)]" /></div>
              <button disabled={!selected.length || loading} onClick={submit} className="btn btn-primary">{loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}Submit answer</button>
            </div>
          )}

          {result?.reveal && (
            <div className={`mt-7 rounded-2xl border p-5 ${result.is_correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
              <div className="flex items-center gap-2">{result.is_correct ? <CheckCircle2 className="text-emerald-600" /> : <XCircle className="text-red-600" />}<h2 className="text-lg font-black">{result.is_correct ? "Correct" : "Not quite"}</h2></div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{result.explanation}</p>
              {result.learning_point && <div className="mt-4 rounded-xl bg-white/70 p-4"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--primary)]">Learning point</p><p className="mt-2 text-sm font-semibold leading-6">{result.learning_point}</p></div>}
              {result.reference_text && <p className="mt-4 text-xs leading-5 text-slate-500"><strong>Reference:</strong> {result.reference_text}</p>}
            </div>
          )}

          <div className="mt-7 flex justify-between border-t border-slate-100 pt-5">
            <button disabled={index === 0} onClick={() => navigateTo(index - 1)} className="btn btn-secondary"><ChevronLeft size={18} />Previous</button>
            {index < questions.length - 1 ? (
              <button onClick={() => navigateTo(index + 1)} className="btn btn-secondary">Next<ChevronRight size={18} /></button>
            ) : (
              <button disabled={finishing} onClick={finish} className="btn btn-primary">{finishing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}Finish session</button>
            )}
          </div>
        </section>

        <aside className="card h-fit p-4 xl:sticky xl:top-20">
          <div className="flex items-center gap-2"><Menu size={18} /><h2 className="font-black">Question navigator</h2></div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((item, itemIndex) => (
              <button key={item.id} onClick={() => navigateTo(itemIndex)} className={`relative aspect-square rounded-xl text-xs font-black ${itemIndex === index ? "bg-slate-900 text-white" : item.answered ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                {itemIndex + 1}{item.flagged && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-orange-500" />}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-2 text-xs text-slate-500"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-300" />Answered</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-500" />Flagged</span></div>
          <button disabled={finishing} onClick={finish} className="btn btn-secondary mt-5 w-full">End session</button>
        </aside>
      </div>
    </div>
  );
}
