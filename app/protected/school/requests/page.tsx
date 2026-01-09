import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation";
import SchoolRequestsClient from "./RequestsClient";

export default async function SchoolRequestsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        redirect('/sign-in')
    }

    const { data: requests, error } = await supabase
        .from('teaching_requests')
        .select(`
            *,
            teacher:teacher_profiles (
                full_name,
                subjects
            )
        `)
        .eq('school_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching requests:', error);
        return <div>Error loading requests</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Sent Requests</h1>
                    <p className="text-muted-foreground mt-1">Track and manage teaching requests sent to educators.</p>
                </div>
            </div>
            <SchoolRequestsClient initialRequests={requests || []} userId={user.id} />
        </div>
    );
}
