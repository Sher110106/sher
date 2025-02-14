import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    // Process expired requests in batches
    const { data: expiredRequests } = await supabase
      .from('teaching_requests')
      .select('*')
      .lte('timeout_at', new Date().toISOString())
      .eq('status', 'pending')
      .limit(10); // Process 10 at a time

    for (const request of expiredRequests || []) {
      const fallbackTeachers = request.fallback_teachers || [];
      
      if (fallbackTeachers.length === 0) {
        await supabase
          .from('teaching_requests')
          .update({ status: 'failed' })
          .eq('id', request.id);
        continue;
      }

      // Move to next teacher
      const nextTeacher = fallbackTeachers.shift();
      
      await supabase
        .from('teaching_requests')
        .update({
          teacher_id: nextTeacher,
          fallback_teachers: fallbackTeachers,
          timeout_at: new Date(Date.now() + 7200 * 1000).toISOString()
        })
        .eq('id', request.id);
    }

    return NextResponse.json({ processed: expiredRequests?.length || 0 });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process timeouts" },
      { status: 500 }
    );
  }
}
