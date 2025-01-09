'use client'
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
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
    return `${date.toLocaleDateString('en-US', { weekday: 'long' })}: ${scheduleData.time}`;
  }).join(', ');
};

export function TeachingRequestsList({ 
  initialRequests,
  supabase,
  userId
}: Props) {
  const [requests, setRequests] = useState<TeachingRequest[]>(() => 
    initialRequests
      .filter(req => req.teacher_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  );
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (userId) {
      setRequests(initialRequests
        .filter(req => req.teacher_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
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

      setRequests(prev =>
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

          setRequests(prev => [...prev, newRequest]);
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

          setRequests(prev =>
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
    return <div className="text-center py-8 text-gray-500">Please sign in to view your teaching requests</div>;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {request.school.school_name}
                </h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Subject:</span> {request.subject || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {request.school.block}, {request.school.cluster}, {request.school.district}, {request.school.state}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Schedule:</span> {formatSchedule(request.schedule)}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Requested on:</span> {formatDate(request.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
                
                {request.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      disabled={loading[request.id]}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, 'accepted')}
                      disabled={loading[request.id]}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {requests.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No teaching requests yet
        </div>
      )}
    </div>
  );
}

export default TeachingRequestsList;