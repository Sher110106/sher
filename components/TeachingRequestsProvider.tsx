'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, ChevronLeft, ChevronRight, Calendar, MapPin, BookOpen, Clock, Link2, AlertCircle, CheckCircle2 } from "lucide-react";

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
  
  // Google OAuth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Calculate pagination values
  const totalPages = Math.ceil(allRequests.length / REQUESTS_PER_PAGE);
  const startIndex = (currentPage - 1) * REQUESTS_PER_PAGE;
  const endIndex = startIndex + REQUESTS_PER_PAGE;
  const currentRequests = allRequests.slice(startIndex, endIndex);

  // Check for OAuth return and pending requests
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthResult = urlParams.get('oauth');
    
    if (oauthResult === 'success') {
      setOauthStatus('success');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Check for pending accept request
      const storedRequestId = localStorage.getItem('pendingAcceptRequestId');
      if (storedRequestId) {
        localStorage.removeItem('pendingAcceptRequestId');
        // Auto-accept the pending request
        setTimeout(() => {
          handleStatusUpdate(storedRequestId, 'accepted');
        }, 500);
      }
      
      // Clear status after 3 seconds
      setTimeout(() => setOauthStatus('idle'), 3000);
    } else if (oauthResult === 'error') {
      setOauthStatus('error');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setOauthStatus('idle'), 5000);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      setAllRequests(initialRequests
        .filter(req => req.teacher_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
      setCurrentPage(1); // Reset to first page when requests change
    }
  }, [initialRequests, userId]);

  const checkGoogleAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/google/status');
      if (!response.ok) return false;
      const data = await response.json();
      return data.connected === true;
    } catch (error) {
      console.error('Error checking Google auth status:', error);
      return false;
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    if (!userId) return;
    
    // If accepting, check Google auth first
    if (newStatus === 'accepted') {
      const isGoogleConnected = await checkGoogleAuth();
      
      if (!isGoogleConnected) {
        // Store the pending request and show modal
        setPendingRequestId(requestId);
        setShowAuthModal(true);
        return;
      }
    }
    
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

  const handleConnectGoogle = () => {
    if (pendingRequestId) {
      // Store pending request ID for after OAuth
      localStorage.setItem('pendingAcceptRequestId', pendingRequestId);
    }
    setShowAuthModal(false);
    // Redirect to Google OAuth
    window.location.href = `/api/auth/google?teacherId=${userId}`;
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
      <>
        {/* OAuth Status Notifications */}
        {oauthStatus === 'success' && (
          <div className="mb-4 flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg animate-slide-up">
            <CheckCircle2 className="h-5 w-5" />
            <span>Google Calendar connected successfully!</span>
          </div>
        )}
        {oauthStatus === 'error' && (
          <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg animate-slide-up">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to connect Google Calendar. Please try again.</span>
          </div>
        )}

        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No teaching requests yet</h3>
            <p className="text-muted-foreground">You'll see new requests from schools here</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Google Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect Google Calendar
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                To accept teaching requests and automatically create Google Meet links, you need to connect your Google Calendar.
              </p>
              <p className="text-sm text-muted-foreground">
                This allows Quad to schedule classes on your calendar and generate meeting links for your sessions.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowAuthModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectGoogle} className="gap-2">
              <Link2 className="h-4 w-4" />
              Connect Google Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OAuth Status Notifications */}
      {oauthStatus === 'success' && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg animate-slide-up">
          <CheckCircle2 className="h-5 w-5" />
          <span>Google Calendar connected successfully!</span>
        </div>
      )}
      {oauthStatus === 'error' && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg animate-slide-up">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to connect Google Calendar. Please try again.</span>
        </div>
      )}

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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2 pt-4">
          {/* Mobile: Compact Previous/Next */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-9"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            
            {/* Mobile: Show only current page info */}
            <div className="flex items-center gap-1 sm:hidden text-sm text-muted-foreground">
              <span>{currentPage}</span>
              <span>/</span>
              <span>{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-9"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          
          {/* Desktop: Full pagination */}
          <div className="hidden sm:flex gap-1">
            {(() => {
              const pages = [];
              const maxVisiblePages = 5;
              
              if (totalPages <= maxVisiblePages) {
                // Show all pages if total is small
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Show smart pagination with ellipsis
                if (currentPage <= 3) {
                  // Show first pages + ellipsis + last
                  pages.push(1, 2, 3, 4);
                  if (totalPages > 5) pages.push('...');
                  pages.push(totalPages);
                } else if (currentPage >= totalPages - 2) {
                  // Show first + ellipsis + last pages
                  pages.push(1);
                  if (totalPages > 5) pages.push('...');
                  for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Show first + ellipsis + current-1, current, current+1 + ellipsis + last
                  pages.push(1);
                  pages.push('...');
                  pages.push(currentPage - 1, currentPage, currentPage + 1);
                  pages.push('...');
                  pages.push(totalPages);
                }
              }
              
              return pages.map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="flex items-center justify-center w-8 h-8 text-muted-foreground">
                      ...
                    </span>
                  );
                }
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className="w-8 h-8 p-0 text-sm"
                  >
                    {page}
                  </Button>
                );
              });
            })()}
          </div>
        </div>
      )}
      </div>
    </>
  );
}


export default TeachingRequestsList;