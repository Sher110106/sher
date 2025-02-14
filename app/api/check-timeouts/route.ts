// app/api/check-timeouts/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    // Get expired requests
    const { data: expiredRequests } = await supabase
      .from('teaching_requests')
      .select('*')
      .lte('timeout_at', new Date().toISOString())
      .eq('status', 'pending');

    if (!expiredRequests?.length) {
      return NextResponse.json({ processed: 0 });
    }

    let processedCount = 0;

    for (const request of expiredRequests) {
      // Find next best teacher
      const { data: teachers } = await supabase
        .from('teacher_profiles')
        .select('id')
        .contains('subjects', [request.subject])
        .gte('teaching_grade', request.grade_level)
        .not('id', 'in', `(${request.previous_teachers?.join(',') || ''})`)
        .order('avg_rating', { ascending: false })
        .limit(1);

      if (!teachers?.length) {
        // Mark as failed if no teachers found
        await supabase
          .from('teaching_requests')
          .update({ status: 'failed' })
          .eq('id', request.id);
        continue;
      }

      // Update request with new teacher
      await supabase
        .from('teaching_requests')
        .update({
          teacher_id: teachers[0].id,
          previous_teachers: [...(request.previous_teachers || []), request.teacher_id],
          timeout_at: new Date(Date.now() + 7200 * 1000).toISOString()
        })
        .eq('id', request.id);

      processedCount++;
    }

    return NextResponse.json({ processed: processedCount });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process timeouts" },
      { status: 500 }
    );
  }
}
