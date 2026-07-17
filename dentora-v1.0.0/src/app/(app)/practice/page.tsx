import { Suspense } from "react";
import { PageHeading } from "@/components/page-heading";
import { PracticeBuilder } from "@/components/practice-builder";
import { createClient } from "@/lib/supabase/server";
import type { Subject,Topic } from "@/lib/types";
export const metadata={title:"Build a session"};
export default async function PracticePage(){const supabase=await createClient();const [{data:subjects},{data:topics}]=await Promise.all([supabase.from("subjects").select("id,name,slug,icon").order("sort_order"),supabase.from("topics").select("id,subject_id,name,slug").order("sort_order")]);return <><PageHeading eyebrow="Practice" title="Build your revision session" description="Choose exactly what you want to practise, or leave filters broad for a mixed session."/><Suspense fallback={<div className="card h-96 skeleton"/>}><PracticeBuilder subjects={(subjects||[]) as Subject[]} topics={(topics||[]) as Topic[]}/></Suspense></>}
