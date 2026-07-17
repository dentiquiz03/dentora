import { notFound } from "next/navigation";
import { SessionPlayer } from "@/components/session-player";
import { createClient } from "@/lib/supabase/server";
import type { SessionPayload } from "@/lib/types";
export const metadata={title:"Revision session"};
export default async function SessionPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const supabase=await createClient();const {data,error}=await supabase.rpc("get_session_payload",{p_session_id:id});if(error||!data)notFound();const payload=data as SessionPayload;if(payload.session.status==="completed") return <div className="card p-8"><h1 className="text-2xl font-black">This session is complete.</h1><a className="btn btn-primary mt-5" href={`/practice/results/${id}`}>View results</a></div>;return <SessionPlayer initial={payload}/>;}
