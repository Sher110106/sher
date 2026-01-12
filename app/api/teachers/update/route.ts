// app/api/teachers/update/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.json();

        // First get the teacher profile associated with this user
        const { data: teacherProfile, error: profileError } = await supabase
            .from('teacher_profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            throw new Error('Teacher profile not found');
        }

        // Build update object with only provided fields
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (formData.full_name !== undefined) updateData.full_name = formData.full_name;
        if (formData.subjects !== undefined) updateData.subjects = formData.subjects;
        if (formData.qualifications !== undefined) updateData.qualifications = formData.qualifications;
        if (formData.experience_years !== undefined) updateData.experience_years = formData.experience_years;
        if (formData.teaching_grade !== undefined) updateData.teaching_grade = formData.teaching_grade;
        if (formData.availability !== undefined) updateData.availability = formData.availability;
        if (formData.onboarding_completed !== undefined) updateData.onboarding_completed = formData.onboarding_completed;

        const { error } = await supabase
            .from('teacher_profiles')
            .update(updateData)
            .eq('id', teacherProfile.id);

        if (error) throw error;

        return NextResponse.json({ message: 'Teacher updated successfully' });
    } catch (error) {
        console.error('Teacher update error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' }, 
            { status: 500 }
        );
    }
}