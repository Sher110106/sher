// app/protected/school/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SchoolClient from "./schoolclient";

export default async function SchoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <SchoolClient />;
}