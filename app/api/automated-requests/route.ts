import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface AutomatedRequestParams {
  subject: string;
  schedule: { date: string; time: string };
  grade_level: number;
  minimum_rating?: number;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  
  // Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: AutomatedRequestParams = await req.json();
    
    // Get top 3 teachers (reduced from 5)
    const { data: teachers, error } = await supabase
      .from('teacher_profiles')
      .select('id, avg_rating')
      .contains('subjects', [body.subject])
      .gte('teaching_grade', body.grade_level)
      .order('avg_rating', { ascending: false })
      .limit(3)
      .throwOnError();

    if (!teachers?.length) {
      return NextResponse.json(
        { error: "No available teachers match criteria" },
        { status: 404 }
      );
    }

    // Create initial request with first teacher
    const { data: request } = await supabase
      .from('teaching_requests')
      .insert({
        school_id: user.id,
        teacher_id: teachers[0].id,
        subject: body.subject,
        schedule: body.schedule,
        status: 'pending',
        timeout_at: new Date(Date.now() + 7200 * 1000).toISOString(),
        fallback_teachers: teachers.slice(1).map(t => t.id) // Store backup teachers
      })
      .select()
      .single()
      .throwOnError();

    return NextResponse.json(request);

  } catch (error) {
    console.error('Automated request error:', error);
    return NextResponse.json(
      { error: "Failed to process automated request" },
      { status: 500 }
    );
  }
}
