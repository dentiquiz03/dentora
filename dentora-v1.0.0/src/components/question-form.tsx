"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Difficulty, QuestionType, Subject, Topic } from "@/lib/types";

type QuestionStatus = "draft" | "published" | "archived";
type Opt = { label: string; option_text: string; is_correct: boolean };

type FormState = {
  external_id: string;
  question_type: QuestionType;
  stem: string;
  clinical_vignette: string;
  explanation: string;
  learning_point: string;
  reference_text: string;
  subject_id: string;
  topic_id: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  tags: string;
};

interface Initial {
  id?: string;
  external_id?: string | null;
  question_type?: QuestionType;
  stem?: string;
  clinical_vignette?: string | null;
  explanation?: string;
  learning_point?: string | null;
  reference_text?: string | null;
  subject_id?: string;
  topic_id?: string | null;
  difficulty?: Difficulty;
  status?: QuestionStatus;
  tags?: string[];
  options?: Opt[];
}

const labels = "ABCDEFGHIJ".split("");

export function QuestionForm({
  subjects,
  topics,
  initial = {},
}: {
  subjects: Subject[];
  topics: Topic[];
  initial?: Initial;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    external_id: initial.external_id || "",
    question_type: initial.question_type || "single_best_answer",
    stem: initial.stem || "",
    clinical_vignette: initial.clinical_vignette || "",
    explanation: initial.explanation || "",
    learning_point: initial.learning_point || "",
    reference_text: initial.reference_text || "",
    subject_id: initial.subject_id || subjects[0]?.id || "",
    topic_id: initial.topic_id || "",
    difficulty: initial.difficulty || "standard",
    status: initial.status || "draft",
    tags: (initial.tags || []).join(" | "),
  });
  const [options, setOptions] = useState<Opt[]>(
    initial.options?.length
      ? initial.options
      : labels.slice(0, 5).map((label) => ({ label, option_text: "", is_correct: false })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const shownTopics = useMemo(
    () => topics.filter((topic) => topic.subject_id === form.subject_id),
    [topics, form.subject_id],
  );

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setOption(index: number, patch: Partial<Opt>) {
    setOptions((current) => current.map((option, itemIndex) => (itemIndex === index ? { ...option, ...patch } : option)));
  }

  function markCorrect(index: number) {
    setOptions((current) =>
      current.map((option, itemIndex) => ({
        ...option,
        is_correct:
          form.question_type === "multiple_select"
            ? itemIndex === index
              ? !option.is_correct
              : option.is_correct
            : itemIndex === index,
      })),
    );
  }

  function removeOption(index: number) {
    setOptions((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((option, itemIndex) => ({ ...option, label: labels[itemIndex] })),
    );
  }

  async function save() {
    setLoading(true);
    setError("");
    const body = {
      ...form,
      external_id: form.external_id || null,
      clinical_vignette: form.clinical_vignette || null,
      learning_point: form.learning_point || null,
      reference_text: form.reference_text || null,
      topic_id: form.topic_id || null,
      tags: form.tags.split("|").map((tag) => tag.trim()).filter(Boolean),
      options: options.filter((option) => option.option_text.trim()),
    };
    const url = initial.id ? `/api/admin/questions/${initial.id}` : "/api/admin/questions";
    const response = await fetch(url, {
      method: initial.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "Could not save question");
      setLoading(false);
      return;
    }
    router.push("/admin/questions");
    router.refresh();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
      <section className="card p-5 md:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="label">External ID</label><input className="input" value={form.external_id} onChange={(event) => field("external_id", event.target.value)} placeholder="e.g. DENT-0001" /></div>
          <div><label className="label">Question type</label><select className="input" value={form.question_type} onChange={(event) => field("question_type", event.target.value as QuestionType)}><option value="single_best_answer">Single best answer</option><option value="multiple_select">Multiple select</option><option value="true_false">True / false</option></select></div>
        </div>
        <div className="mt-5"><label className="label">Clinical vignette (optional)</label><textarea className="input min-h-24" value={form.clinical_vignette} onChange={(event) => field("clinical_vignette", event.target.value)} placeholder="Patient presentation, history and examination findings…" /></div>
        <div className="mt-5"><label className="label">Question stem</label><textarea className="input min-h-32" value={form.stem} onChange={(event) => field("stem", event.target.value)} placeholder="Ask one clear, unambiguous question…" /></div>

        <div className="mt-7">
          <div className="flex items-center justify-between">
            <label className="label">Answer options</label>
            {options.length < 10 && <button type="button" className="text-xs font-black text-[var(--primary)]" onClick={() => setOptions((current) => [...current, { label: labels[current.length], option_text: "", is_correct: false }])}><Plus size={14} className="inline" /> Add option</button>}
          </div>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.label} className="flex items-center gap-2">
                <button type="button" onClick={() => markCorrect(index)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xs font-black ${option.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-slate-500"}`} title="Mark as correct">{option.label}</button>
                <input className="input" value={option.option_text} onChange={(event) => setOption(index, { option_text: event.target.value })} placeholder={`Option ${option.label}`} />
                {options.length > 2 && <button type="button" className="btn btn-secondary !p-2.5 text-red-500" onClick={() => removeOption(index)}><Trash2 size={16} /></button>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Click the letter to mark the correct answer. Multiple-select questions may have several.</p>
        </div>

        <div className="mt-7"><label className="label">Explanation</label><textarea className="input min-h-40" value={form.explanation} onChange={(event) => field("explanation", event.target.value)} placeholder="Explain the correct reasoning and address plausible distractors…" /></div>
        <div className="mt-5"><label className="label">Learning point</label><textarea className="input min-h-24" value={form.learning_point} onChange={(event) => field("learning_point", event.target.value)} placeholder="One memorable take-home message…" /></div>
        <div className="mt-5"><label className="label">Reference</label><input className="input" value={form.reference_text} onChange={(event) => field("reference_text", event.target.value)} placeholder="Guideline, textbook or source…" /></div>
      </section>

      <aside className="card h-fit p-5 md:p-6 xl:sticky xl:top-20">
        <h2 className="font-black">Classification</h2>
        <div className="mt-5 space-y-5">
          <div><label className="label">Subject</label><select className="input" value={form.subject_id} onChange={(event) => { field("subject_id", event.target.value); field("topic_id", ""); }}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
          <div><label className="label">Topic</label><select className="input" value={form.topic_id} onChange={(event) => field("topic_id", event.target.value)}><option value="">No topic</option>{shownTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></div>
          <div><label className="label">Difficulty</label><select className="input" value={form.difficulty} onChange={(event) => field("difficulty", event.target.value as Difficulty)}><option value="foundation">Foundation</option><option value="standard">Standard</option><option value="advanced">Advanced</option></select></div>
          <div><label className="label">Status</label><select className="input" value={form.status} onChange={(event) => field("status", event.target.value as QuestionStatus)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
          <div><label className="label">Tags (separate with |)</label><input className="input" value={form.tags} onChange={(event) => field("tags", event.target.value)} placeholder="diagnosis | radiology" /></div>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          <button disabled={loading} onClick={save} className="btn btn-primary w-full">{loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}Save question</button>
        </div>
      </aside>
    </div>
  );
}
