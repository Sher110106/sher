import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from '@/utils/rate-limit';

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  if (limiter.isRateLimited(ip, 10)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { teaching_request_id, rating, comment } = body;

    if (!teaching_request_id || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify this school is authorized to rate this request
    const { data: request, error: requestError } = await supabase
      .from('teaching_requests')
      .select('school_id, teacher_id, status')
      .eq('id', teaching_request_id)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.school_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You did not initiate this request" }, { status: 403 });
    }

    if (request.status !== 'accepted') {
      return NextResponse.json({ error: "Only accepted classes can be reviewed" }, { status: 400 });
    }

    // 2. Insert or update the review
    const { data: review, error: reviewError } = await supabase
      .from('teacher_reviews')
      .upsert({
        school_id: user.id,
        teacher_id: request.teacher_id,
        teaching_request_id,
        rating,
        comment,
      }, { onConflict: 'teaching_request_id' })
      .select()
      .single();

    if (reviewError) {
      console.error("Review insertion error:", reviewError);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Review API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
