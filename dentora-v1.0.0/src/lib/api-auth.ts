import { createClient } from "@/lib/supabase/server";
export async function getAdminApiContext(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return {supabase,user:null,isAdmin:false};const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();return {supabase,user,isAdmin:profile?.role==="admin"};}
