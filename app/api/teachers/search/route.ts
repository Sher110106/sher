import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface AvailabilitySlot {
  day: string;
  time_range: {
    start: string;
    end: string;
  };
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const user=supabase.auth.getUser();
    
    const { searchParams } = new URL(req.url);
    
    // Parse search parameters
    const subject = searchParams.get("subject");
    const minExperience = parseInt(searchParams.get("minExperience") || "0");
    const maxExperience = parseInt(searchParams.get("maxExperience") || "100");
    const qualifications = searchParams
      .get("qualifications")
      ?.split(",")
      .map((q) => q.trim());
    const availability = searchParams.get("availability")
      ? JSON.parse(searchParams.get("availability") || '{}')
      : null;

    // Build base query
    let query = supabase
      .from("teacher_profiles")
      .select(`
        id,
        full_name,
        subjects,
        qualifications,
        experience_years,
        teaching_grade,
        availability
      `)
      .order("experience_years", { ascending: false })
      .limit(20);

    // Apply filters
    if (subject) {
      // Case-insensitive subject match
      // Use ilike for array of subjects (Postgres array column)
      // Supabase does not support ilike directly on arrays, so we filter in JS after fetching
      // To avoid fetching too many rows, we can still use contains for a rough filter
      query = query.or(
        `subjects.cs.{${JSON.stringify([subject])}},subjects.cs.{${JSON.stringify([subject.toLowerCase()])}},subjects.cs.{${JSON.stringify([subject.toUpperCase()])}}`
      );
    }

    if (minExperience || maxExperience) {
      query = query
        .gte("experience_years", minExperience)
        .lte("experience_years", maxExperience);
    }

    if (qualifications?.length) {
      query = query.overlaps("qualifications", qualifications);
    }

    // Handle availability search with new JSONB structure
    if (availability?.day) {
      // Search for teachers available on the specified day
      query = query.filter('availability->schedule', 'cs', JSON.stringify([{ day: availability.day }]));

      if (availability.startTime) {
        // If a specific start time is provided, filter for that time
        query = query.filter('availability->schedule', 'cs', 
          JSON.stringify([{ 
            time_range: { 
              start: availability.startTime 
            }
          }])
        );
      }
    }

    // Add grade to the query building
    if (searchParams.get("teaching_grade")) {
      const teaching_grade = parseInt(searchParams.get("teaching_grade") || "0");
      if (!isNaN(teaching_grade) && teaching_grade > 0) {
        query = query.eq("teaching_grade", teaching_grade);
      }
    }

    // Execute query and handle response
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching teachers:", error);
      return NextResponse.json(
        { error: "Failed to fetch teachers" },
        { status: 500 }
      );
    }

    // Post-process the results to ensure availability matches
    let filteredData = data;
    // Case-insensitive subject filter (final check)
    if (subject) {
      filteredData = filteredData.filter(teacher =>
        Array.isArray(teacher.subjects) &&
        teacher.subjects.some((s: string) => s.toLowerCase() === subject.toLowerCase())
      );
    }
    if (availability?.day && availability?.startTime) {
      filteredData = data.filter(teacher => {
        return teacher.availability?.schedule?.some((slot: AvailabilitySlot) => 
          slot.day === availability.day &&
          slot.time_range.start === availability.startTime
        );
      });
    }

    return NextResponse.json({
      teachers: filteredData,
      count: filteredData.length,
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}