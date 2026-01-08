// app/api/automated-requests/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from '@/utils/rate-limit';

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
    
    // Get qualified teachers
    const { data: teachers, error } = await supabase
      .from('teacher_profiles')
      .select('id, avg_rating')
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

    // Create initial request with fallbacks
    const { data: request, error: insertError } = await supabase
      .from('teaching_requests')
      .insert({
        school_id: user.id,
        teacher_id: teachers[0].id,
        subject: body.subject,
        schedule: body.schedule,
        status: 'pending',
        timeout_at: new Date(Date.now() + 7200 * 1000).toISOString(),
        fallback_teachers: teachers.slice(1).map(t => t.id)
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
