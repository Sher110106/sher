// app/school/edit/SchoolEditForm.tsx
'use client';

import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface SchoolFormData {
    schoolName: string;
    state: string;
    district: string;
    cluster: string;
    block: string;
    
}

interface SchoolEditFormProps {
    initialData: SchoolFormData;
}

const SchoolEditForm: React.FC<SchoolEditFormProps> = ({ initialData }) => {
    const [formData, setFormData] = useState<SchoolFormData>(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updateMessage, setUpdateMessage] = useState('');

    const handleChange = (field: keyof SchoolFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUpdateMessage('');

        try {
            const response = await fetch('/api/school/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update school information');
            }

            setUpdateMessage('School information updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>School Details</CardTitle>
                <CardDescription>Update your school information here</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}
                    {updateMessage && (
                        <div className="bg-green-50 text-green-500 p-3 rounded-md mb-4">
                            {updateMessage}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input
                            id="schoolName"
                            value={formData.schoolName}
                            onChange={(e) => handleChange('schoolName', e.target.value)}
                            placeholder="Enter school name"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => handleChange('state', e.target.value)}
                            placeholder="Enter state"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="district">District</Label>
                        <Input
                            id="district"
                            value={formData.district}
                            onChange={(e) => handleChange('district', e.target.value)}
                            placeholder="Enter district"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cluster">Cluster</Label>
                        <Input
                            id="cluster"
                            value={formData.cluster}
                            onChange={(e) => handleChange('cluster', e.target.value)}
                            placeholder="Enter cluster"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="block">Block</Label>
                        <Input
                            id="block"
                            value={formData.block}
                            onChange={(e) => handleChange('block', e.target.value)}
                            placeholder="Enter block"
                            className="w-full"
                        />
                    </div>

                   
                </CardContent>
                <CardFooter>
                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update School Information'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default SchoolEditForm;