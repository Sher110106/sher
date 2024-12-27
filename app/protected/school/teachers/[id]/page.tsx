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

interface Teacher {
  id: string;
  full_name: string;
  subjects: string[];
  qualifications: string[];
  experience_years: number;
  availability: { day: string; time: string } | null;
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

      // Validate form data
      if (!formData.subject || !formData.date || !formData.time) {
        throw new Error("Please fill in all fields");
      }
      
      const response = await fetch('/api/teaching-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: id,
          subject: formData.subject,
          schedule: {
            date: formData.date,
            time: formData.time
          }
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
        description: error instanceof Error ? error.message : "Failed to submit teaching request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!teacher) return <p>Teacher not found</p>;

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold">{teacher.full_name}</h1>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button>Send Request</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Teaching Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Subject</label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                      >
                        <SelectTrigger>
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
                      <label className="text-sm font-medium">Date</label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Time</label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p><strong>Subjects:</strong> {teacher.subjects?.join(", ") || "No subjects listed"}</p>
              <p><strong>Experience:</strong> {teacher.experience_years} years</p>
              <p><strong>Qualifications:</strong> {teacher.qualifications?.join(", ") || "No qualifications listed"}</p>
              <p>
                <strong>Availability:</strong>{" "}
                {teacher.availability 
                  ? `${teacher.availability.day} at ${teacher.availability.time}`
                  : "No availability set"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
}