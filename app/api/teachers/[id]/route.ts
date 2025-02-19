import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Correctly typing the handler for dynamic routes
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // Explicitly type the params as a promise
) {
  try {
    const { id } = await context.params; // Await the params since it may be a promise

    if (!id) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("teacher_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch teacher data" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ teacher: data });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
