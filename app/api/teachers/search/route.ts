import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

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

    // Build query
    let query = supabase
      .from("teacher_profiles")
      .select(`
        id,
        full_name,
        subjects,
        qualifications,
        experience_years,
        availability
      `)
      .order("experience_years", { ascending: false })
      .limit(20);

    // Apply filters based on search parameters
    if (subject) {
      query = query.contains("subjects", [subject]);
    }

    if (minExperience || maxExperience) {
      query = query
        .gte("experience_years", minExperience)
        .lte("experience_years", maxExperience);
    }

    if (qualifications?.length) {
      query = query.overlaps("qualifications", qualifications);
    }

    if (availability?.day && availability?.time) {
      query = query.contains("availability", availability);
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

    return NextResponse.json({
      teachers: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
