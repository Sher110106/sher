import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }


    // Get the school profile for the authenticated user
  
    const schoolProfile=user.id;
    if (!schoolProfile) {
      return NextResponse.json(
        { error: "School profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.teacher_id || !body.subject || !body.schedule) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert the teaching request with the actual school ID
    const { data, error } = await supabase
      .from("teaching_requests")
      .insert([{
        school_id: schoolProfile,
        teacher_id: body.teacher_id,
        subject: body.subject,
        schedule: body.schedule,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating request:", error);
      return NextResponse.json(
        { error: "Failed to create teaching request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    console.error("Request error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}