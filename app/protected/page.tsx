import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check for teacher profile
  const { data: teacherProfile } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (teacherProfile) {
    redirect("/protected/teacher/dashboard");
  }

  // Check for school profile
  const { data: schoolProfile } = await supabase
    .from('school_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (schoolProfile) {
    redirect("/protected/school/dashboard");
  }

  // If no profile is found, redirect to sign-in
  redirect("/sign-in");
}