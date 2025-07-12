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
  teaching_grade: number;
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
  teaching_grade: number | null;
  availability: {
    day: string;
    startTime?: string;
    endTime?: string;
  } | null;
  sortBy: 'experience_desc' | 'experience_asc' | 'name_asc' | 'name_desc';
}

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

const SUBJECT_OPTIONS = [
  "Math",
  "Science",
  "English",
  "History",
  "Geography",
  "Computer Science",
  "Art",
  "Physical Education",
  "Music",
  "Economics",
  "Civics",
  "Other"
];

export default function SchoolClient() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    subject: '',
    minExperience: 0,
    maxExperience: 100,
    qualifications: [],
    teaching_grade: null,
    availability: null,
    sortBy: 'experience_desc'
  });
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");

  const router = useRouter();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      let subjectToSearch = "";
      if (selectedSubject === "other") {
        subjectToSearch = customSubject;
      } else if (selectedSubject) {
        subjectToSearch = selectedSubject;
      }
      if (subjectToSearch) {
        queryParams.set('subject', subjectToSearch);
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
      if (filters.teaching_grade) {
        queryParams.set('teaching_grade', filters.teaching_grade.toString());
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
    if (key === 'minExperience' || key === 'maxExperience') {
      const numValue = parseInt(value);
      const validValue = isNaN(numValue) ? (key === 'minExperience' ? 0 : 100) : numValue;
      setFilters(prev => ({ ...prev, [key]: validValue }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleTeacherClick = (teacherId: string) => {
    router.push(`teachers/${teacherId}`); 
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-4">
      {/* Header with Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Find Teachers</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center w-full sm:w-auto"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters */}
      <Card className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Filters</h2>
          
          {/* Mobile: Stacked Layout, Desktop: Grid Layout */}
          <div className="space-y-3 sm:space-y-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 lg:gap-6">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <select
                value={selectedSubject}
                onChange={e => {
                  setSelectedSubject(e.target.value);
                  if (e.target.value !== "other") setCustomSubject("");
                }}
                className="h-9 sm:h-10 w-full border rounded-md px-2"
              >
                <option value="">Select a subject</option>
                {SUBJECT_OPTIONS.map(subject => (
                  <option key={subject.toLowerCase()} value={subject.toLowerCase()}>
                    {subject}
                  </option>
                ))}
              </select>
              {selectedSubject === "other" && (
                <Input
                  type="text"
                  placeholder="Enter custom subject..."
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  className="h-9 sm:h-10 mt-2"
                  required
                />
              )}
            </div>

            {/* Experience Range Filter */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium">Experience Range (years)</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min={0}
                  max={filters.maxExperience}
                  value={filters.minExperience.toString()}
                  onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                  className="w-16 sm:w-20 h-9 sm:h-10 text-xs sm:text-sm"
                  placeholder="Min"
                />
                <span className="text-xs sm:text-sm text-muted-foreground">to</span>
                <Input
                  type="number"
                  min={filters.minExperience}
                  max={100}
                  value={filters.maxExperience.toString()}
                  onChange={(e) => handleFilterChange('maxExperience', e.target.value)}
                  className="w-16 sm:w-20 h-9 sm:h-10 text-xs sm:text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Grade Level Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade Level</label>
              <Select
                value={filters.teaching_grade?.toString() || 'any'}
                onValueChange={(value) => handleFilterChange('teaching_grade', value === 'any' ? null : parseInt(value))}
              >
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Grade</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter - Mobile Stacked */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium">Availability</label>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Select
                  value={filters.availability?.day || ''}
                  onValueChange={(day: string) =>
                    handleFilterChange('availability', day ? { day } : null)
                  }
                >
                  <SelectTrigger className="h-9 sm:h-10">
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
                  <SelectTrigger className="h-9 sm:h-10">
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
                <SelectTrigger className="h-9 sm:h-10">
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
        </CardContent>
      </Card>

      {/* Teachers List */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold">Available Teachers</h2>
          {teachers.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">Loading teachers...</p>
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 lg:gap-6">
            {teachers.map((teacher) => (
              <Card 
                key={teacher.id} 
                onClick={() => handleTeacherClick(teacher.id)} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
              >
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold">{teacher.full_name}</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium text-muted-foreground shrink-0">Subjects:</span>
                        <span className="sm:ml-2 truncate">{teacher.subjects.join(", ")}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium text-muted-foreground shrink-0">Experience:</span>
                        <span className="sm:ml-2">{teacher.experience_years} years</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium text-muted-foreground shrink-0">Grade Level:</span>
                        <span className="sm:ml-2">
                          {teacher.teaching_grade ? `Grade ${teacher.teaching_grade}` : 'Not specified'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium text-muted-foreground shrink-0">Qualifications:</span>
                        <span className="sm:ml-2 truncate">{teacher.qualifications.join(", ")}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 sm:pt-3 border-t border-border">
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-muted-foreground text-xs sm:text-sm">Availability:</span>
                        <div className="flex flex-wrap gap-1 text-xs">
                          {teacher.availability?.schedule.map((slot, index) => (
                            <span 
                              key={index}
                              className="bg-secondary px-2 py-1 rounded-md text-secondary-foreground"
                            >
                              {slot.day} ({slot.time_range.start} - {slot.time_range.end})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">
              No teachers found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
