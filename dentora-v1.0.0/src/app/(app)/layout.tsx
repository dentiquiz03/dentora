import { AppShell } from "@/components/app-shell";
import { getCurrentProfile, requireUser } from "@/lib/auth";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) { await requireUser(); const profile=await getCurrentProfile(); if(!profile) return <main className="p-10">Your profile has not been created. Run the database setup script again.</main>; return <AppShell profile={profile}>{children}</AppShell>; }
