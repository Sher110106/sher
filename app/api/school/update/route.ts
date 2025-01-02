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
        const { data: schoolProfile, error: profileError } = await supabase
            .from('school_profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            throw new Error('School profile not found');
        }

        const { error } = await supabase
            .from('school_profiles')
            .update({
                school_name: formData.schoolName,
                state: formData.state,
                district: formData.district,
                cluster: formData.cluster,
                block: formData.block,
                curriculum_type: formData.curriculumType,
                updated_at: new Date().toISOString()
            })
            .eq('id', schoolProfile.id);

        if (error) throw error;

        return NextResponse.json({ message: 'School updated successfully' });
    } catch (error) {
        console.error('School update error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' }, 
            { status: 500 }
        );
    }
}