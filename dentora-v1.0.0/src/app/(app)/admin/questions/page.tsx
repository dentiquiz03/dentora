import Link from "next/link";
import { FileQuestion, Plus } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import { QuestionActions } from "@/components/question-actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface QuestionListItem {
  id: string;
  external_id: string | null;
  stem: string;
  question_type: string;
  difficulty: string;
  status: string;
  updated_at: string;
  subjects: { name: string } | null;
  topics: { name: string } | null;
}

export const metadata = { title: "Question library" };

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("id,external_id,stem,question_type,difficulty,status,updated_at,subjects(name),topics(name)")
    .order("updated_at", { ascending: false })
    .limit(250);
  if (params.q) query = query.ilike("stem", `%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);
  const { data } = await query;
  const items = (data || []) as unknown as QuestionListItem[];

  return (
    <>
      <PageHeading eyebrow="Content" title="Question library" description="The master list of every draft, published and archived question." action={<Link className="btn btn-primary" href="/admin/questions/new"><Plus size={18} />New question</Link>} />
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_180px_auto]">
        <input name="q" defaultValue={params.q} className="input" placeholder="Search question text…" />
        <select name="status" defaultValue={params.status || ""} className="input"><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
        <button className="btn btn-secondary">Filter</button>
      </form>
      {items.length ? (
        <div className="card overflow-hidden"><div className="divide-y divide-slate-100">{items.map((question) => (
          <div key={question.id} className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${question.status === "published" ? "bg-emerald-50 text-emerald-700" : question.status === "draft" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{question.status}</span>
                <span className="badge bg-violet-50 text-violet-700">{question.difficulty}</span>
                <span className="badge bg-slate-100 text-slate-600">{question.subjects?.name}</span>
                {question.external_id && <span className="badge bg-slate-100 font-mono text-slate-500">{question.external_id}</span>}
              </div>
              <p className="mt-3 line-clamp-2 max-w-4xl font-bold leading-6">{question.stem}</p>
              <p className="mt-2 text-xs text-slate-400">Updated {new Date(question.updated_at).toLocaleString("en-GB")}</p>
            </div>
            <QuestionActions id={question.id} />
          </div>
        ))}</div></div>
      ) : (
        <EmptyState icon={FileQuestion} title="No questions found" description="Create a question manually or upload your first CSV batch." action={<Link className="btn btn-primary" href="/admin/questions/new">Create question</Link>} />
      )}
    </>
  );
}
