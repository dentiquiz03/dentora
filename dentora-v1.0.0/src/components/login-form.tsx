"use client";
import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [show,setShow]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  async function submit(e: React.FormEvent) { e.preventDefault(); setLoading(true); setError(""); const { error } = await createClient().auth.signInWithPassword({ email, password }); if(error){setError(error.message);setLoading(false);return;} location.href="/dashboard"; }
  return <form onSubmit={submit} className="space-y-5"><div><label className="label" htmlFor="email">Email address</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div><div><label className="label" htmlFor="password">Password</label><div className="relative"><input id="password" className="input pr-12" type={show?"text":"password"} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={()=>setShow(!show)} aria-label="Show password">{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>{error&&<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}<button disabled={loading} className="btn btn-primary w-full" type="submit">{loading?<Loader2 className="animate-spin" size={18}/>:<LogIn size={18}/>} Sign in</button><p className="text-center text-xs leading-5 text-slate-400">Registration is disabled. Accounts are created by the administrator.</p></form>;
}
