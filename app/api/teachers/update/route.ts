// app/api/schools/update/route.js
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

        // First get the school profile associated with this user
        const { data: teacherProfile, error: profileError } = await supabase
            .from('teacher_profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            throw new Error('Teacher profile not found');
        }

        const { error } = await supabase
            .from('teacher_profiles')
            .update({
                full_name: formData.full_name,
                subjects: formData.subjects,
                qualifications: formData.qualifications,
                experience_years: formData.experience_years,
                teaching_grade: formData.teaching_grade,
                updated_at: new Date().toISOString()
            })
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