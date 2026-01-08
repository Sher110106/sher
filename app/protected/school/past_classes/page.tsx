import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PastClassesClient from "./pastclassesclient"

export default async function Past_classes() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return <div>Please sign in to view past classes.</div>;
    }

    const { data: classes, error } = await supabase
        .from('meeting_details')
        .select(`
            *,
            teacher_profiles (
                id,
                full_name,
                subjects,
                avg_rating,
                review_count
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching classes:', error);
        return <div>Error loading past classes</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Past Classes</h1>
            <PastClassesClient initialClasses={classes} />
        </div>
    );
}