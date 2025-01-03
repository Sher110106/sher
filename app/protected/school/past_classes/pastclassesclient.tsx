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
}

interface PastClassesClientProps {
    initialClasses: ClassDetails[];
}

export default function PastClassesClient({ initialClasses }: PastClassesClientProps) {
    const [classes, setClasses] = useState<ClassDetails[]>(initialClasses);
    const [loading, setLoading] = useState<string | null>(null);
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
                    </CardContent>
                </Card>
            ))}
        </div>
    );
} 