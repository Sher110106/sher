// app/api/automated-requests/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from '@/utils/rate-limit';
import { rankTeachers } from '@/utils/teacher-ranking';

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });
 
interface AutomatedRequestParams {
  subject: string;
  schedule: { date: string; time: string };
  grade_level: number;
  minimum_rating?: number;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  if (limiter.isRateLimited(ip, 5)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = await createClient();
  
  // Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: AutomatedRequestParams = await req.json();
    
    // Get qualified teachers matching subject and grade
    const { data: teachers, error } = await supabase
      .from('teacher_profiles')
      .select('id, avg_rating, experience_years, availability')
      .contains('subjects', [body.subject])
      .gte('teaching_grade', body.grade_level)
      .limit(20); // Get more candidates for ranking

    if (error) {
      console.error('Teacher query error:', error);
      throw error;
    }

    if (!teachers?.length) {
      return NextResponse.json(
        { error: "No available teachers match criteria" },
        { status: 404 }
      );
    }

    // Apply minimum rating filter if specified
    let filteredTeachers = teachers;
    if (body.minimum_rating) {
      filteredTeachers = teachers.filter(t => 
        t.avg_rating !== null && t.avg_rating >= body.minimum_rating!
      );
    }

    if (!filteredTeachers.length) {
      return NextResponse.json(
        { error: "No teachers meet the minimum rating requirement" },
        { status: 404 }
      );
    }

    // Use enhanced multi-factor ranking algorithm
    // This ranks by: availability matching (40%), rating (30%), 
    // response time (20%), and experience (10%)
    const rankedTeacherIds = await rankTeachers(filteredTeachers, user.id, body.schedule);

    // Take top 5 for primary + fallbacks
    const topTeachers = rankedTeacherIds.slice(0, 5);

    if (topTeachers.length === 0) {
      return NextResponse.json(
        { error: "No teachers available after ranking" },
        { status: 404 }
      );
    }

    // Create initial request with fallbacks
    const { data: request, error: insertError } = await supabase
      .from('teaching_requests')
      .insert({
        school_id: user.id,
        teacher_id: topTeachers[0],
        subject: body.subject,
        schedule: body.schedule,
        status: 'pending',
        timeout_at: new Date(Date.now() + 7200 * 1000).toISOString(),
        fallback_teachers: topTeachers.slice(1)
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(request);

  } catch (error) {
    console.error('Automated request error:', error);
    return NextResponse.json(
      { error: "Failed to process automated request" },
      { status: 500 }
    );
  }
}

