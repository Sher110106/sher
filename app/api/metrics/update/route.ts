// app/api/metrics/update/route.ts
// Scheduled job endpoint to update teacher_metrics table
// Can be called via cron job, Supabase Edge Function, or manually

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Verify webhook secret for security
  const secret = process.env.METRICS_UPDATE_SECRET;
  if (secret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = await createClient();
  
  try {
    // Get all teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_profiles')
      .select('id');

    if (teachersError) throw teachersError;
    if (!teachers?.length) {
      return NextResponse.json({ message: 'No teachers found', updated: 0 });
    }

    let updatedCount = 0;

    for (const teacher of teachers) {
      // Calculate metrics for each teacher
      const { data: requests } = await supabase
        .from('teaching_requests')
        .select('id, status, created_at, responded_at, cancelled_by')
        .eq('teacher_id', teacher.id);

      if (!requests?.length) continue;

      const totalReceived = requests.length;
      const responded = requests.filter(r => r.responded_at || r.status !== 'pending');
      const totalResponses = responded.length;

      // Calculate average response time (in hours)
      const responseTimes = responded
        .filter(r => r.responded_at)
        .map(r => {
          const created = new Date(r.created_at).getTime();
          const responded = new Date(r.responded_at).getTime();
          return (responded - created) / (1000 * 60 * 60); // Convert to hours
        });
      
      const avgResponseTimeHours = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null;

      // Calculate success metrics
      const accepted = requests.filter(r => r.status === 'accepted');
      const totalAccepted = accepted.length;
      
      // Count completed sessions (past date + accepted status)
      const now = new Date();
      const completed = requests.filter(r => {
        if (r.status !== 'accepted' && r.status !== 'completed') return false;
        // For now, count all accepted as potential completed
        // In production, you'd check if session date has passed
        return true;
      });
      const totalCompleted = completed.length;

      // Count teacher-initiated cancellations
      const cancelledByTeacher = requests.filter(r => 
        r.status === 'cancelled' && r.cancelled_by === teacher.id
      ).length;

      // Calculate success rate
      const successRate = totalAccepted > 0 
        ? totalCompleted / totalAccepted 
        : null;

      // Upsert metrics
      const { error: upsertError } = await supabase
        .from('teacher_metrics')
        .upsert({
          teacher_id: teacher.id,
          total_requests_received: totalReceived,
          total_responses: totalResponses,
          avg_response_time_hours: avgResponseTimeHours ? parseFloat(avgResponseTimeHours.toFixed(2)) : null,
          total_accepted: totalAccepted,
          total_completed: totalCompleted,
          total_cancelled_by_teacher: cancelledByTeacher,
          success_rate: successRate ? parseFloat(successRate.toFixed(2)) : null,
          last_calculated_at: new Date().toISOString()
        }, {
          onConflict: 'teacher_id'
        });

      if (upsertError) {
        console.error(`Error updating metrics for teacher ${teacher.id}:`, upsertError);
      } else {
        updatedCount++;
      }
    }

    // Also update school-teacher affinity scores
    const { data: completedSessions } = await supabase
      .from('teaching_requests')
      .select('school_id, teacher_id')
      .in('status', ['accepted', 'completed']);

    if (completedSessions?.length) {
      // Group by school-teacher pairs
      const affinityMap = new Map<string, { school_id: string; teacher_id: string; count: number }>();
      
      for (const session of completedSessions) {
        const key = `${session.school_id}-${session.teacher_id}`;
        if (!affinityMap.has(key)) {
          affinityMap.set(key, {
            school_id: session.school_id,
            teacher_id: session.teacher_id,
            count: 0
          });
        }
        affinityMap.get(key)!.count++;
      }

      // Upsert affinity records
      for (const affinity of Array.from(affinityMap.values())) {
        await supabase
          .from('school_teacher_affinity')
          .upsert({
            school_id: affinity.school_id,
            teacher_id: affinity.teacher_id,
            sessions_completed: affinity.count,
            last_session_at: new Date().toISOString()
          }, {
            onConflict: 'school_id,teacher_id'
          });
      }
    }

    return NextResponse.json({ 
      message: 'Metrics updated successfully',
      updated: updatedCount,
      total: teachers.length
    });

  } catch (error) {
    console.error('Metrics update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET(req: Request) {
  return POST(req);
}
