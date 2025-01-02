// app/school/edit/page.tsx
import { createClient } from "@/utils/supabase/server";
import SchoolEditForm from './form';

export default async function SchoolEditPage() {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return <div>Please sign in to edit school details.</div>;
    }

    const { data: schoolData, error } = await supabase
        .from('school_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching school data:', error);
        return <div>Error loading school data</div>;
    }

    const formattedData = {
        schoolName: schoolData?.school_name || '',
        state: schoolData?.state || '',
        district: schoolData?.district || '',
        cluster: schoolData?.cluster || '',
        block: schoolData?.block || '',
        curriculumType: schoolData?.curriculum_type || ''
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <SchoolEditForm initialData={formattedData} />
        </div>
    );
}