'use client'

import { useParams } from 'next/navigation';
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ArrowLeft, User, Calendar, Clock, Award, BookOpen } from "lucide-react";
import Link from "next/link";

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

interface RequestForm {
  subject: string;
  date: string;
  time: string;
}

export default function TeacherDetail() {
  const params = useParams();
  const id = params.id as string;
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<RequestForm>({
    subject: '',
    date: '',
    time: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      const fetchTeacherDetails = async () => {
        try {
          const response = await fetch(`/api/teachers/${id}`);
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch teacher details");
          }
          const data = await response.json();
          setTeacher(data.teacher);
          if (data.teacher.subjects?.length > 0) {
            setFormData(prev => ({ ...prev, subject: data.teacher.subjects[0] }));
          }
        } catch (error) {
          console.error("Error fetching teacher details:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load teacher details",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchTeacherDetails();
    }
  }, [id, toast]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
  
      if (!formData.subject || !formData.date || !formData.time) {
        throw new Error("Please fill in all fields");
      }
  
      // Convert time to hh:mm AM/PM format
      const timeParts = formData.time.split(":");
      let hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      const isPM = hours >= 12;
      hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      const formattedTime = `${hours}:${minutes} ${isPM ? "PM" : "AM"}`;
      console.log("Formatted time:", formattedTime);
  
      const response = await fetch("/api/teaching-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacher_id: id,
          subject: formData.subject,
          schedule: {
            date: formData.date,
            time: formattedTime,
          },
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }
  
      toast({
        title: "Success",
        description: "Teaching request has been sent successfully",
        variant: "default",
      });
  
      setShowDialog(false);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit teaching request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground text-sm sm:text-base">Loading teacher details...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4">
        <p className="text-muted-foreground text-sm sm:text-base">Teacher not found</p>
        <Link href="/protected/school/teachers">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Teachers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-4">
        {/* Back Navigation */}
        <div className="flex items-center gap-4">
          <Link href="/protected/school/teachers">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Teachers</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>

        {/* Teacher Profile Card */}
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6 xl:p-8">
            {/* Header with Name and Request Button */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto sm:mx-0">
                  <User className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-primary" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">{teacher.full_name}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {teacher.experience_years} years of experience
                  </p>
                </div>
              </div>
              
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto text-sm sm:text-base">
                    <span className="sm:hidden">Send Request</span>
                    <span className="hidden sm:inline">Send Teaching Request</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg lg:text-xl">Send Teaching Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject</label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                      >
                        <SelectTrigger className="h-9 sm:h-10">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {teacher.subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date</label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="h-9 sm:h-10"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Time</label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                        className="h-9 sm:h-10"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting}
                      className="w-full h-9 sm:h-10 text-sm sm:text-base"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Teacher Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Basic Information */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Teaching Information
                </h2>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">Subjects</label>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                      {teacher.subjects?.map((subject, index) => (
                        <span 
                          key={index}
                          className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs sm:text-sm font-medium"
                        >
                          {subject}
                        </span>
                      )) || <span className="text-muted-foreground text-xs sm:text-sm">No subjects listed</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Experience</label>
                      <p className="text-sm sm:text-base font-medium">{teacher.experience_years} years</p>
                    </div>
                    
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Grade Level</label>
                      <p className="text-sm sm:text-base font-medium">
                        {teacher.teaching_grade ? `Grade ${teacher.teaching_grade}` : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">Qualifications</label>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                      {teacher.qualifications?.map((qual, index) => (
                        <span 
                          key={index}
                          className="bg-secondary px-2 py-1 rounded-md text-xs sm:text-sm"
                        >
                          {qual}
                        </span>
                      )) || <span className="text-muted-foreground text-xs sm:text-sm">No qualifications listed</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Availability
                </h2>
                
                <div className="space-y-2">
                  {teacher.availability?.schedule?.length > 0 ? (
                    teacher.availability.schedule.map((slot, index) => (
                      <div 
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-secondary/50 rounded-lg gap-1 sm:gap-2"
                      >
                        <span className="font-medium text-sm sm:text-base">{slot.day}</span>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{slot.time_range.start} - {slot.time_range.end}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 sm:py-6 text-muted-foreground">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">No availability schedule provided</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
}