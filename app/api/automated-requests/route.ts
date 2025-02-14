// app/api/automated-requests/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { setTimeout } from "timers/promises";

interface AutomatedRequestParams {
  subject: string;
  schedule: {
    date: string;
    time: string;
  };
  grade_level: number;
  minimum_rating?: number;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  
  // Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: AutomatedRequestParams = await req.json();
  
  // Find best matching teachers
  const { data: teachers, error } = await supabase
    .from('teacher_profiles')
    .select(`
      id,
      avg_rating,
      subjects,
      teaching_grade,
      availability
    `)
    .contains('subjects', [body.subject])
    .gte('teaching_grade', body.grade_level)
    .order('avg_rating', { ascending: false })
    .limit(5);

  if (!teachers?.length) {
    return NextResponse.json(
      { error: "No available teachers match criteria" },
      { status: 404 }
    );
  }

  // Create timeout-aware request
  const createRequestWithFallback = async (teacherIndex = 0): Promise<any> => {
    if (teacherIndex >= teachers.length) {
      return { error: "No teachers available" };
    }

    const teacher = teachers[teacherIndex];
    
    // Create initial request
    const { data: request, error } = await supabase
      .from('teaching_requests')
      .insert({
        school_id: user.id,
        teacher_id: teacher.id,
        subject: body.subject,
        schedule: body.schedule,
        status: 'pending',
        timeout_at: new Date(Date.now() + 7200 * 1000).toISOString() // 2 hours
      })
      .select()
      .single();

    if (error) return { error };

    // Wait for response or timeout
    let status = 'pending';
    do {
      await setTimeout(5000); // Check every 5 seconds
      const { data: current } = await supabase
        .from('teaching_requests')
        .select('status')
        .eq('id', request.id)
        .single();
      status = current?.status || 'pending';
    } while (status === 'pending' && new Date(request.timeout_at) > new Date());

    // Handle timeout
    if (status === 'pending') {
      await supabase
        .from('teaching_requests')
        .update({ status: 'timeout' })
        .eq('id', request.id);

      return createRequestWithFallback(teacherIndex + 1);
    }

    return request;
  };

  try {
    const result = await createRequestWithFallback();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process automated request" },
      { status: 500 }
    );
  }
}
