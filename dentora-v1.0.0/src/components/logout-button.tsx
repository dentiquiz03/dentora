"use client";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
export function LogoutButton() {
  return <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={async()=>{await createClient().auth.signOut(); location.href="/login";}}><LogOut size={18}/> Sign out</button>;
}
