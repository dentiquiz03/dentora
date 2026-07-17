import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const schema=z.object({question_id:z.string().uuid(),selected_option_ids:z.array(z.string().uuid()).min(1),confidence:z.number().int().min(1).max(5).nullable().optional(),time_seconds:z.number().int().min(0).max(86400)});
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const input=schema.parse(await request.json());const supabase=await createClient();const {data,error}=await supabase.rpc("submit_session_answer",{p_session_id:id,p_question_id:input.question_id,p_selected_option_ids:input.selected_option_ids,p_confidence:input.confidence??null,p_time_seconds:input.time_seconds});if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json(data);}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400});}}
