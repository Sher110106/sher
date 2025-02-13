'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface ClassDetails {
    id: string;
    meet_link: string;
    summary: string;
    description: string;
    recording: string | null;
    teacher_profiles: {
        full_name: string;
        subjects: string[];
    };
    created_at: string;
    rating?: number;
    avg_rating?: number;
}

interface PastClassesClientProps {
    initialClasses: ClassDetails[];
}

export default function PastClassesClient({ initialClasses }: PastClassesClientProps) {
    const [classes, setClasses] = useState<ClassDetails[]>(initialClasses);
    const [loading, setLoading] = useState<string | null>(null);
    const supabase = createClient();
    const handleRatingSubmit = async (classId: string, rating: number) => {
        if (rating < 1 || rating > 5) {
            alert('Invalid rating value');
            return;
        }
    
        setLoading(classId);
        try {
            // 1. Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Authentication required');
            }
    
            // 2. Get meeting details with teacher ID
            const { data: meeting, error: meetingError } = await supabase
                .from('meeting_details')
                .select('teaching_request_id, teacher_id')
                .eq('id', classId)
                .single();
    
            if (meetingError || !meeting?.teaching_request_id) {
                throw new Error('Class details not found');
            }
    
            // 3. Verify school participation
            const { data: teachingRequest, error: requestError } = await supabase
                .from('teaching_requests')
                .select('school_id')
                .eq('id', meeting.teaching_request_id)
                .single();
    
            if (requestError || !teachingRequest) {
                throw new Error('Failed to verify class ownership');
            }
    
            if (teachingRequest.school_id !== user.id) {
                throw new Error('Only participating schools can rate classes');
            }
    
            // 4. Update class rating
            const { error: updateError } = await supabase
                .from('meeting_details')
                .update({ rating })
                .eq('id', classId);
    
            if (updateError) throw updateError;
    
            // 5. Calculate new average rating
            const { data: allRatings, error: ratingsError } = await supabase
                .from('meeting_details')
                .select('rating')
                .eq('teacher_id', meeting.teacher_id)
                .not('rating', 'is', null);
    
            if (ratingsError) throw new Error('Failed to calculate average rating');
    
            const totalRatings = allRatings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
            const avgRating = allRatings.length > 0 
                ? Number((totalRatings / allRatings.length).toFixed(2))
                : 0;
    
            // 6. Update teacher's average rating
            const { error: avgUpdateError } = await supabase
                .from('teacher_profiles')
                .update({ avg_rating: avgRating })
                .eq('id', meeting.teacher_id);
    
            if (avgUpdateError) throw new Error('Failed to update average rating');
    
            // Update local state with both ratings
            setClasses(prev => prev.map(cls => 
                cls.id === classId 
                    ? { ...cls, rating, avg_rating: avgRating }
                    : cls
            ));
    
        } catch (error) {
            console.error('Error updating rating:', error);
            alert(error instanceof Error ? error.message : 'Rating update failed');
        } finally {
            setLoading(null);
        }
    };
    
    const handleRecordingUpdate = async (classId: string, recordingLink: string) => {
        setLoading(classId);
        try {
            const { error } = await supabase
                .from('meeting_details')
                .update({ recording: recordingLink })
                .eq('id', classId);

            if (error) throw error;

            setClasses(prev => prev.map(cls => 
                cls.id === classId 
                    ? { ...cls, recording: recordingLink }
                    : cls
            ));

        } catch (error) {
            console.error('Error updating recording:', error);
            alert('Failed to update recording link');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
                <Card key={cls.id} className="overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg">{cls.summary}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium">Teacher</p>
                            <p className="text-sm">{cls.teacher_profiles.full_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Subjects</p>
                            <p className="text-sm">{cls.teacher_profiles.subjects.join(", ")}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Date</p>
                            <p className="text-sm">
                                {new Date(cls.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Meeting Link</p>
                            <a 
                                href={cls.meet_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Join Meeting
                            </a>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Recording</p>
                            <div className="flex gap-2">
                                <Input
                                    type="url"
                                    placeholder="Add recording link"
                                    defaultValue={cls.recording || ''}
                                    onBlur={(e) => {
                                        if (e.target.value !== cls.recording) {
                                            handleRecordingUpdate(cls.id, e.target.value);
                                        }
                                    }}
                                />
                                {loading === cls.id && (
                                    <Button disabled size="sm">
                                        Saving...
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Class Rating</p>
                            <select 
                                value={cls.rating || 0}
                                onChange={(e) => handleRatingSubmit(cls.id, Number(e.target.value))}
                                className="border rounded-md p-2 w-full"
                                disabled={loading === cls.id}
                            >
                                <option value="0">Rate this class</option>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num} Stars</option>
                                ))}
                            </select>
                            {cls.avg_rating && (
                                <p className="text-sm text-muted-foreground">
                                    Teacher Average: {cls.avg_rating}/5
                                </p>
                            )}
                        </div>

                    </CardContent>
                </Card>
            ))}
        </div>
    );
}