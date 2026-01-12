// utils/teacher-ranking.ts
// Enhanced multi-factor teacher ranking algorithm for automated matching

import { createClient } from "@/utils/supabase/server";

export interface TeacherScore {
  teacherId: string;
  ratingScore: number;      // From avg_rating (0-100)
  responseScore: number;    // Based on avg response time (0-100)
  experienceScore: number;  // Years mapped to 0-100
  availabilityScore: number; // Based on profile match and flexibility (0-100)
  totalScore: number;       // Weighted combination
}

// Configurable weights for ranking factors
export const RANKING_WEIGHTS = {
  rating: 0.30,      // 30% - Teaching quality rating
  response: 0.20,    // 20% - Fast responders ranked higher
  experience: 0.10,  // 10% - Years of experience
  availability: 0.40  // 40% - Availability match and flexibility
};

interface TeacherMetrics {
  teacher_id: string;
  avg_response_time_hours: number | null;
  total_completed: number;
}

interface TeacherProfile {
  id: string;
  avg_rating: number | null;
  experience_years: number;
  availability?: {
    schedule: Array<{
      day: string;
      time_range: {
        start: string;
        end: string;
      };
    }>;
  };
}

/**
 * Normalize a rating (1-5 scale) to 0-100 score
 */
export function normalizeRating(rating: number | null): number {
  if (rating === null) return 50; // Default to middle if no rating
  return Math.min(100, Math.max(0, ((rating - 1) / 4) * 100));
}

/**
 * Normalize response time (in hours) to 0-100 score
 */
export function normalizeResponseTime(hours: number | null): number {
  if (hours === null) return 50; 
  const maxHours = 24;
  const score = Math.max(0, (1 - hours / maxHours)) * 100;
  return Math.min(100, Math.max(0, score));
}

/**
 * Normalize experience years to 0-100 score
 */
export function normalizeExperience(years: number): number {
  const maxYears = 20;
  return Math.min(100, (years / maxYears) * 100);
}

/**
 * Calculate availability score (0-100)
 * Ranks teachers based on:
 * 1. Exact match with requested schedule (80% of score)
 * 2. General teaching flexibility (20% of score)
 */
export function calculateAvailabilityScore(
  availability: TeacherProfile['availability'],
  requestedSchedule: { date: string; time: string }
): number {
  if (!availability?.schedule || availability.schedule.length === 0) return 20; // Some points for just being registered

  // 1. Check for exact match
  // Convert date to day of week
  const dateObj = new Date(requestedSchedule.date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const requestedDay = days[dateObj.getDay()];
  
  const hasExactMatch = availability.schedule.some(slot => 
    slot.day === requestedDay && 
    (slot.time_range.start === requestedSchedule.time || requestedSchedule.time.includes(slot.time_range.start))
  );

  const matchScore = hasExactMatch ? 100 : 0;

  // 2. Flexibility Score (reward teachers with more availability slots)
  // Assume teachers with 10+ slots are "very flexible"
  const flexScore = Math.min(100, (availability.schedule.length / 10) * 100);

  // Weighted availability score
  return (matchScore * 0.8) + (flexScore * 0.2);
}

/**
 * Calculate multi-factor scores for a list of teachers relative to a specific school and schedule
 */
export async function calculateTeacherScores(
  teacherProfiles: TeacherProfile[],
  schoolId: string,
  requestedSchedule: { date: string; time: string }
): Promise<TeacherScore[]> {
  const supabase = await createClient();
  const teacherIds = teacherProfiles.map(t => t.id);

  // Fetch metrics for all teachers
  const { data: metricsData } = await supabase
    .from('teacher_metrics')
    .select('teacher_id, avg_response_time_hours, total_completed')
    .in('teacher_id', teacherIds);

  const metricsMap = new Map<string, TeacherMetrics>(
    (metricsData || []).map(m => [m.teacher_id, m])
  );

  // Calculate scores for each teacher
  const scores: TeacherScore[] = teacherProfiles.map(teacher => {
    const metrics = metricsMap.get(teacher.id);

    const ratingScore = normalizeRating(teacher.avg_rating);
    const responseScore = normalizeResponseTime(metrics?.avg_response_time_hours ?? null);
    const experienceScore = normalizeExperience(teacher.experience_years);
    const availabilityScore = calculateAvailabilityScore(teacher.availability, requestedSchedule);

    // Calculate weighted total
    const totalScore = 
      ratingScore * RANKING_WEIGHTS.rating +
      responseScore * RANKING_WEIGHTS.response +
      experienceScore * RANKING_WEIGHTS.experience +
      availabilityScore * RANKING_WEIGHTS.availability;

    return {
      teacherId: teacher.id,
      ratingScore,
      responseScore,
      experienceScore,
      availabilityScore,
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
  schoolId: string,
  requestedSchedule: { date: string; time: string }
): Promise<string[]> {
  if (teacherProfiles.length === 0) return [];
  
  const scores = await calculateTeacherScores(teacherProfiles, schoolId, requestedSchedule);
  return scores.map(s => s.teacherId);
}

