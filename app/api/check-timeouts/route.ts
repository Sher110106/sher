// app/api/check-timeouts/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    // Process expired requests
    const { data: expiredRequests } = await supabase
      .from('teaching_requests')
      .select('*')
      .lte('timeout_at', new Date().toISOString())
      .eq('status', 'pending');

    let processed = 0;

    for (const request of expiredRequests || []) {
      // Type guard for fallback_teachers
      const fallbackTeachers = (request.fallback_teachers || []) as string[];
      
      if (fallbackTeachers.length === 0) {
        await supabase
          .from('teaching_requests')
          .update({ status: 'failed' })
          .eq('id', request.id);
        continue;
      }

      // Get next teacher from fallback list
      const [nextTeacher, ...remaining] = fallbackTeachers;
      
      const { error } = await supabase
        .from('teaching_requests')
        .update({
          teacher_id: nextTeacher,
          fallback_teachers: remaining,
          timeout_at: new Date(Date.now() + 7200 * 1000).toISOString()
        })
        .eq('id', request.id);

      if (!error) processed++;
    }

    return NextResponse.json({ processed });
    
  } catch (error) {
    console.error('Timeout processing error:', error);
    return NextResponse.json(
      { error: "Failed to process timeouts" },
      { status: 500 }
    );
  }
}
