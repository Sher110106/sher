// app/school/edit/SchoolEditForm.tsx
'use client';

import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface TeacherFormData {
    full_name: string;
    subjects: string[];
    qualifications: string[];
    experience_years: number;
    teaching_grade: number;
}

interface TeacherEditFormProps {
    initialData: TeacherFormData;
}

const TeacherEditForm: React.FC<TeacherEditFormProps> = ({ initialData }) => {
    const [formData, setFormData] = useState<TeacherFormData>(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updateMessage, setUpdateMessage] = useState('');

    const handleChange = (field: keyof TeacherFormData, value: any) => {
        if (field === 'teaching_grade' || field === 'experience_years') {
            const numValue = parseInt(value) || 0;
            setFormData(prev => ({
                ...prev,
                [field]: numValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUpdateMessage('');

        try {
            const response = await fetch('/api/teachers/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update teacher information');
            setUpdateMessage('Teacher information updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Teacher Details</CardTitle>
                <CardDescription>Update your teaching profile</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
                    )}
                    {updateMessage && (
                        <div className="bg-green-50 text-green-500 p-3 rounded-md">{updateMessage}</div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="teaching_grade">Teaching Grade</Label>
                        <Input
                            id="teaching_grade"
                            type="number"
                            min="1"
                            max="12"
                            value={formData.teaching_grade.toString()}
                            onChange={(e) => handleChange('teaching_grade', e.target.value)}
                            placeholder="Enter teaching grade"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="experience_years">Years of Experience</Label>
                        <Input
                            id="experience_years"
                            type="number"
                            min="0"
                            value={formData.experience_years.toString()}
                            onChange={(e) => handleChange('experience_years', e.target.value)}
                            placeholder="Enter years of experience"
                        />
                    </div>

                    

                    {/* Add subject and qualification selection UI here */}
                </CardContent>
                <CardFooter>
                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default TeacherEditForm;