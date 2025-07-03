'use client'
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { Check, X, ChevronLeft, ChevronRight, Calendar, MapPin, BookOpen, Clock } from "lucide-react";

interface Schedule {
  day: string;
  startTime: string;
  endTime: string;
}

interface TeachingRequest {
  id: string;
  school_id: string;
  teacher_id: string;
  status: string;
  created_at: string;
  subject: string;
  schedule: Schedule[] | null;
  school: {
    school_name: string;
    state: string;
    district: string;
    cluster: string;
    block: string;
  };
}

interface Props {
  initialRequests: TeachingRequest[];
  supabase: any;
  userId: string;
}

interface DatabaseChangePayload {
  new: {
    id: string;
    teacher_id: string;
    [key: string]: any;
  };
}

const REQUESTS_PER_PAGE = 10;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

const parseSchedule = (scheduleData: any): Schedule[] => {
  try {
    const schedule = typeof scheduleData === 'string' 
      ? JSON.parse(scheduleData) 
      : scheduleData;
    
    // Handle single schedule object
    if (schedule && !Array.isArray(schedule)) {
      const date = new Date(schedule.date);
      return [{
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        startTime: schedule.time,
        endTime: '' // Remove end time
      }];
    }
    
    return Array.isArray(schedule) ? schedule : [];
  } catch (error) {
    console.error('Error parsing schedule:', error);
    return [];
  }
};

const formatSchedule = (scheduleData: any): string => {
  if (!scheduleData) return 'No schedule set';
  
  const schedule = parseSchedule(scheduleData);
  if (schedule.length === 0) return 'No schedule set';

  return schedule.map(slot => {
    const date = new Date(scheduleData.date);
    return `${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${scheduleData.time}`;
  }).join(', ');
};

export function TeachingRequestsList({ 
  initialRequests,
  supabase,
  userId
}: Props) {
  const [allRequests, setAllRequests] = useState<TeachingRequest[]>(() => 
    initialRequests
      .filter(req => req.teacher_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Calculate pagination values
  const totalPages = Math.ceil(allRequests.length / REQUESTS_PER_PAGE);
  const startIndex = (currentPage - 1) * REQUESTS_PER_PAGE;
  const endIndex = startIndex + REQUESTS_PER_PAGE;
  const currentRequests = allRequests.slice(startIndex, endIndex);

  useEffect(() => {
    if (userId) {
      setAllRequests(initialRequests
        .filter(req => req.teacher_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
      setCurrentPage(1); // Reset to first page when requests change
    }
  }, [initialRequests, userId]);

  const handleStatusUpdate = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const { error } = await supabase
        .from('teaching_requests')
        .update({ status: newStatus })
        .eq('id', requestId)
        .eq('teacher_id', userId);

      if (error) throw error;

      setAllRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      );
    } catch (error) {
      console.error('Error updating request status:', error);
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('teaching_requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'teaching_requests',
        },
        async (payload: DatabaseChangePayload) => {
          if (payload.new.teacher_id !== userId) return;

          const { data: newRequest, error } = await supabase
            .from('teaching_requests')
            .select(`
              *,
              school:school_profiles(
                school_name,
                state,
                district,
                cluster,
                block
              )
            `)
            .eq('id', payload.new.id)
            .eq('teacher_id', userId)
            .single();

          if (error) {
            console.error('Error fetching new request:', error);
            return;
          }

          setAllRequests(prev => [newRequest, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teaching_requests',
        },
        async (payload: DatabaseChangePayload) => {
          if (payload.new.teacher_id !== userId) return;

          setAllRequests(prev =>
            prev.map(request =>
              request.id === payload.new.id ? { ...request, ...payload.new } : request
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, userId]);

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to view your teaching requests</p>
      </div>
    );
  }

  if (allRequests.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No teaching requests yet</h3>
          <p className="text-muted-foreground">You'll see new requests from schools here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Requests Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, allRequests.length)} of {allRequests.length} requests
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {currentRequests.map((request, index) => (
          <Card 
            key={request.id} 
            interactive
            className="animate-slide-up" 
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Request Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {request.school.school_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            request.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                              : request.status === 'accepted'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Subject:</span>
                      <span className="font-medium">{request.subject || 'Not specified'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">
                        {request.school.district}, {request.school.state}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Schedule:</span>
                      <span className="font-medium">{formatSchedule(request.schedule)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div className="flex gap-3 lg:flex-col lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      disabled={loading[request.id]}
                      className="flex-1 lg:flex-none text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-950/20 transition-all duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, 'accepted')}
                      disabled={loading[request.id]}
                      className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-10 h-10"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default TeachingRequestsList;