'use client'

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation'; 

interface Teacher {
  id: string;
  full_name: string;
  subjects: string[];
  qualifications: string[];
  experience_years: number;
  availability: {
    schedule: Array<{
      day: string;
      time_range: {
        start: string;
        end: string;
      };
    }>;
  };
}

interface FilterState {
  subject: string;
  minExperience: number;
  maxExperience: number;
  qualifications: string[];
  availability: {
    day: string;
    time?: string;
    startTime?: string;
    endTime?: string;
  } | null;
  sortBy: 'experience_desc' | 'experience_asc' | 'name_asc' | 'name_desc';
}

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function SchoolClient() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    subject: '',
    minExperience: 0,
    maxExperience: 100,
    qualifications: [],
    availability: null,
    sortBy: 'experience_desc'
  });

  const router = useRouter(); // For navigation

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['Morning', 'Afternoon', 'Evening'];

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.subject) {
        queryParams.set('subject', filters.subject);
      }
      if (filters.minExperience > 0) {
        queryParams.set('minExperience', filters.minExperience.toString());
      }
      if (filters.maxExperience < 100) {
        queryParams.set('maxExperience', filters.maxExperience.toString());
      }
      if (filters.qualifications.length) {
        queryParams.set('qualifications', filters.qualifications.join(','));
      }
      if (filters.availability) {
        queryParams.set('availability', JSON.stringify(filters.availability));
      }

      const response = await fetch(`/api/teachers/search?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      
      const data: { teachers: Teacher[] } = await response.json();
      let sortedTeachers = [...data.teachers];
      
      // Apply client-side sorting
      switch (filters.sortBy) {
        case 'experience_desc':
          sortedTeachers.sort((a, b) => b.experience_years - a.experience_years);
          break;
        case 'experience_asc':
          sortedTeachers.sort((a, b) => a.experience_years - b.experience_years);
          break;
        case 'name_asc':
          sortedTeachers.sort((a, b) => a.full_name.localeCompare(b.full_name));
          break;
        case 'name_desc':
          sortedTeachers.sort((a, b) => b.full_name.localeCompare(a.full_name));
          break;
      }
      
      setTeachers(sortedTeachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Navigate to Teacher Detail Page
  const handleTeacherClick = (teacherId: string) => {
    router.push(`teachers/${teacherId}`); 
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 space-y-8">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Subject Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              type="text"
              placeholder="Enter subject..."
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            />
          </div>

          {/* Experience Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Experience Range (years)</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min={0}
                max={filters.maxExperience}
                value={filters.minExperience}
                onChange={(e) => handleFilterChange('minExperience', parseInt(e.target.value))}
                className="w-20"
              />
              <span>to</span>
              <Input
                type="number"
                min={filters.minExperience}
                max={100}
                value={filters.maxExperience}
                onChange={(e) => handleFilterChange('maxExperience', parseInt(e.target.value))}
                className="w-20"
              />
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Availability</label>
            <div className="flex space-x-2">
              <Select
                value={filters.availability?.day || ''}
                onValueChange={(day: string) =>
                  handleFilterChange('availability', day ? { day } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.availability?.startTime || ''}
                onValueChange={(startTime: string) =>
                  handleFilterChange('availability', {
                    ...filters.availability,
                    startTime
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Sort Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select
              value={filters.sortBy}
              onValueChange={(value: FilterState['sortBy']) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="experience_desc">Experience (High to Low)</SelectItem>
                <SelectItem value="experience_asc">Experience (Low to High)</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Teachers List</h1>
        {loading ? (
          <p>Loading...</p>
        ) : teachers.length > 0 ? (
          <div className="grid gap-4">
            {teachers.map((teacher) => (
              <Card key={teacher.id} onClick={() => handleTeacherClick(teacher.id)} className="cursor-pointer">
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold">{teacher.full_name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <p><span className="font-medium">Subjects:</span> {teacher.subjects.join(", ")}</p>
                    <p><span className="font-medium">Experience:</span> {teacher.experience_years} years</p>
                    <p><span className="font-medium">Qualifications:</span> {teacher.qualifications.join(", ")}</p>
                    <p>
                      <span className="font-medium">Availability:</span>{" "}
                      {teacher.availability?.schedule.map((slot, index) => (
                        <span key={index}>
                          {slot.day} ({slot.time_range.start} - {slot.time_range.end})
                          {index < teacher.availability.schedule.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p>No teachers found matching your criteria.</p>
        )}
      </div>
    </div>
  );
}
