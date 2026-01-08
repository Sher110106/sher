'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { RatingDisplay } from '@/components/RatingDisplay';
import { ReviewModal } from '@/components/ReviewModal';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar as CalendarIcon, User, BookOpen, Star, MessageSquarePlus } from 'lucide-react';

interface ClassDetails {
    id: string; // Meeting details ID
    meet_link: string;
    summary: string;
    description: string;
    teaching_request_id: string;
    teacher_id: string;
    recording: string | null;
    teacher_profiles: {
        id: string;
        full_name: string;
        subjects: string[];
        avg_rating: number | null;
        review_count: number | null;
    };
    created_at: string;
    rating?: number; // Legacy, kept for compatibility during transition
}

interface PastClassesClientProps {
    initialClasses: ClassDetails[];
}

export default function PastClassesClient({ initialClasses }: PastClassesClientProps) {
    const [classes, setClasses] = useState<ClassDetails[]>(initialClasses);
    const [loading, setLoading] = useState<string | null>(null);
    const [reviewModal, setReviewModal] = useState<{
        isOpen: boolean;
        classId: string;
        teachingRequestId: string;
        teacherName: string;
    }>({
        isOpen: false,
        classId: '',
        teachingRequestId: '',
        teacherName: ''
    });
    
    const supabase = createClient();

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

    const handleReviewSuccess = () => {
        // We could refresh data here, but for now just showing a message or updating local state
        // Since triggers happen on DB, a re-fetch of the teacher stats would be ideal
        window.location.reload(); // Simple refresh to show updated average ratings
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {classes.map((cls) => (
                <Card key={cls.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50">
                    <CardHeader className="bg-secondary/30 pb-4">
                        <CardTitle className="text-lg font-bold flex items-center justify-between">
                            <span className="truncate mr-2">{cls.summary}</span>
                            {cls.rating ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
                                    <Star className="h-3 w-3 fill-yellow-600" />
                                    {cls.rating}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                    Past Session
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Info Sections */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Teacher</p>
                                    <p className="text-sm font-medium">{cls.teacher_profiles.full_name}</p>
                                    <RatingDisplay 
                                        rating={cls.teacher_profiles.avg_rating || 0} 
                                        count={cls.teacher_profiles.review_count || 0}
                                        size="sm"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Subjects</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {cls.teacher_profiles.subjects.map(s => (
                                            <Badge key={s} variant="secondary" className="text-[10px] py-0">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Date</p>
                                    <p className="text-sm">{new Date(cls.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button 
                                variant="outline" 
                                className="w-full h-9 gap-2 text-xs" 
                                asChild
                            >
                                <a href={cls.meet_link} target="_blank" rel="noopener noreferrer">
                                    <Video className="h-4 w-4" />
                                    Relink Case
                                </a>
                            </Button>
                            
                            <Button
                                variant="default"
                                className="w-full h-9 gap-2 text-xs"
                                onClick={() => setReviewModal({
                                    isOpen: true,
                                    classId: cls.id,
                                    teachingRequestId: cls.teaching_request_id,
                                    teacherName: cls.teacher_profiles.full_name
                                })}
                            >
                                <MessageSquarePlus className="h-4 w-4" />
                                Review
                            </Button>
                        </div>

                        {/* Recording Link */}
                        <div className="pt-4 border-t space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Session Recording</p>
                            <div className="flex gap-2">
                                <Input
                                    type="url"
                                    placeholder="Enter recording URL..."
                                    defaultValue={cls.recording || ''}
                                    className="h-8 text-xs bg-muted/50 border-none focus-visible:ring-1"
                                    onBlur={(e) => {
                                        if (e.target.value !== cls.recording) {
                                            handleRecordingUpdate(cls.id, e.target.value);
                                        }
                                    }}
                                />
                                {loading === cls.id && (
                                    <div className="flex items-center">
                                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <ReviewModal 
                isOpen={reviewModal.isOpen}
                onOpenChange={(open) => setReviewModal(prev => ({ ...prev, isOpen: open }))}
                classId={reviewModal.classId}
                teachingRequestId={reviewModal.teachingRequestId}
                teacherName={reviewModal.teacherName}
                onSuccess={handleReviewSuccess}
            />
        </div>
    );
}