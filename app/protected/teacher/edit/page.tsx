// app/school/edit/page.tsx
import { createClient } from "@/utils/supabase/server";
import TeacherEditForm from './form';
import { redirect } from "next/navigation";

export default async function TeacherEditPage() {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/sign-in");
    }

    const { data: teacherData, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching teacher data:', error);
        return <div>Error loading teacher data</div>;
    }

    const formattedData = {
        full_name: teacherData?.full_name || '',
        subjects: teacherData?.subjects || [],
        qualifications: teacherData?.qualifications || [],
        experience_years: teacherData?.experience_years || 0,
        teaching_grade: teacherData?.teaching_grade || 1
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <TeacherEditForm initialData={formattedData} />
        </div>
    );
}