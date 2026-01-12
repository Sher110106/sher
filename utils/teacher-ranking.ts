// utils/teacher-ranking.ts
// Enhanced multi-factor teacher ranking algorithm for automated matching

import { createClient } from "@/utils/supabase/server";

export interface TeacherScore {
  teacherId: string;
  ratingScore: number;      // From avg_rating (0-100)
  responseScore: number;    // Based on avg response time (0-100)
  successScore: number;     // completed / accepted ratio (0-100)
  experienceScore: number;  // Years mapped to 0-100
  affinityScore: number;    // Previous success with this school (0-100)
  totalScore: number;       // Weighted combination
}

// Configurable weights for ranking factors
export const RANKING_WEIGHTS = {
  rating: 0.30,      // 30% - Teaching quality rating
  response: 0.20,    // 20% - Fast responders ranked higher
  success: 0.25,     // 25% - Reliable completion
  experience: 0.10,  // 10% - Years of experience
  affinity: 0.15     // 15% - Previous relationship with school
};

interface TeacherMetrics {
  teacher_id: string;
  avg_response_time_hours: number | null;
  success_rate: number | null;
  total_completed: number;
}

interface SchoolAffinity {
  teacher_id: string;
  sessions_completed: number;
  avg_rating_from_school: number | null;
}

interface TeacherProfile {
  id: string;
  avg_rating: number | null;
  experience_years: number;
}

/**
 * Normalize a rating (1-5 scale) to 0-100 score
 */
export function normalizeRating(rating: number | null): number {
  if (rating === null) return 50; // Default to middle if no rating
  // Map 1-5 to 0-100
  return Math.min(100, Math.max(0, ((rating - 1) / 4) * 100));
}

/**
 * Normalize response time (in hours) to 0-100 score
 * Faster response = higher score
 * 0 hours = 100, 24+ hours = 0
 */
export function normalizeResponseTime(hours: number | null): number {
  if (hours === null) return 50; // Default to middle if no data
  // Inverse mapping: 0h = 100, 24h+ = 0
  const maxHours = 24;
  const score = Math.max(0, (1 - hours / maxHours)) * 100;
  return Math.min(100, Math.max(0, score));
}

/**
 * Normalize success rate (0-1) to 0-100 score
 */
export function normalizeSuccessRate(rate: number | null): number {
  if (rate === null) return 50; // Default if no data
  return Math.min(100, Math.max(0, rate * 100));
}

/**
 * Normalize experience years to 0-100 score
 * Capped at 20 years for max score
 */
export function normalizeExperience(years: number): number {
  const maxYears = 20;
  return Math.min(100, (years / maxYears) * 100);
}

/**
 * Calculate affinity score based on previous sessions with school
 * More sessions + higher ratings = higher affinity
 */
export function calculateAffinityScore(
  sessionsCompleted: number,
  avgRatingFromSchool: number | null
): number {
  if (sessionsCompleted === 0) return 0; // No affinity if no history
  
  // Base score from sessions (max 50 points for 10+ sessions)
  const sessionScore = Math.min(50, sessionsCompleted * 5);
  
  // Rating bonus (max 50 points for 5-star average)
  const ratingScore = avgRatingFromSchool 
    ? ((avgRatingFromSchool - 1) / 4) * 50 
    : 25; // Default to middle if no ratings
  
  return Math.min(100, sessionScore + ratingScore);
}

/**
 * Calculate multi-factor scores for a list of teachers relative to a specific school
 */
export async function calculateTeacherScores(
  teacherProfiles: TeacherProfile[],
  schoolId: string
): Promise<TeacherScore[]> {
  const supabase = await createClient();
  const teacherIds = teacherProfiles.map(t => t.id);

  // Fetch metrics for all teachers
  const { data: metricsData } = await supabase
    .from('teacher_metrics')
    .select('teacher_id, avg_response_time_hours, success_rate, total_completed')
    .in('teacher_id', teacherIds);

  const metricsMap = new Map<string, TeacherMetrics>(
    (metricsData || []).map(m => [m.teacher_id, m])
  );

  // Fetch affinity data for this school
  const { data: affinityData } = await supabase
    .from('school_teacher_affinity')
    .select('teacher_id, sessions_completed, avg_rating_from_school')
    .eq('school_id', schoolId)
    .in('teacher_id', teacherIds);

  const affinityMap = new Map<string, SchoolAffinity>(
    (affinityData || []).map(a => [a.teacher_id, a])
  );

  // Calculate scores for each teacher
  const scores: TeacherScore[] = teacherProfiles.map(teacher => {
    const metrics = metricsMap.get(teacher.id);
    const affinity = affinityMap.get(teacher.id);

    const ratingScore = normalizeRating(teacher.avg_rating);
    const responseScore = normalizeResponseTime(metrics?.avg_response_time_hours ?? null);
    const successScore = normalizeSuccessRate(metrics?.success_rate ?? null);
    const experienceScore = normalizeExperience(teacher.experience_years);
    const affinityScore = affinity 
      ? calculateAffinityScore(affinity.sessions_completed, affinity.avg_rating_from_school)
      : 0;

    // Calculate weighted total
    const totalScore = 
      ratingScore * RANKING_WEIGHTS.rating +
      responseScore * RANKING_WEIGHTS.response +
      successScore * RANKING_WEIGHTS.success +
      experienceScore * RANKING_WEIGHTS.experience +
      affinityScore * RANKING_WEIGHTS.affinity;

    return {
      teacherId: teacher.id,
      ratingScore,
      responseScore,
      successScore,
      experienceScore,
      affinityScore,
      totalScore
    };
  });

  // Sort by total score descending
  return scores.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Rank teachers and return ordered IDs
 * This is the main entry point for the automated-requests API
 */
export async function rankTeachers(
  teacherProfiles: TeacherProfile[],
  schoolId: string
): Promise<string[]> {
  if (teacherProfiles.length === 0) return [];
  
  const scores = await calculateTeacherScores(teacherProfiles, schoolId);
  return scores.map(s => s.teacherId);
}
