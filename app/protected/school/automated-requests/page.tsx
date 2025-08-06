'use client'

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { ChevronLeft, ChevronRight, Calendar, Clock, User, BookOpen, AlertCircle, CheckCircle, XCircle, Loader } from "lucide-react"

interface AutomatedRequest {
  id: string
  subject: string
  schedule: {
    date: string
    time: string
  }
  grade_level?: number
  status: 'pending' | 'accepted' | 'timeout' | 'failed'
  current_teacher?: {
    name: string
    rating: number
  }
  created_at: string
}

interface FormData {
  subject: string
  date: string
  time: string
  grade_level: string
  min_rating: string
}

const REQUESTS_PER_PAGE = 10;
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

export default function AutomatedRequestsPage() {
  
  const [allRequests, setAllRequests] = useState<AutomatedRequest[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    date: '',
    time: '',
    grade_level: '1',
    min_rating: '4.0'
  })
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const supabase = useMemo(() => createClient(), [])

  // Calculate pagination values
  const totalPages = Math.ceil(allRequests.length / REQUESTS_PER_PAGE);
  const startIndex = (currentPage - 1) * REQUESTS_PER_PAGE;
  const endIndex = startIndex + REQUESTS_PER_PAGE;
  const currentRequests = allRequests.slice(startIndex, endIndex);

  const fetchRequests = useCallback(async () => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      setIsLoading(false)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('teaching_requests')
        .select(`
          id,
          subject,
          schedule,
          status,
          teacher_profiles(full_name, avg_rating),
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAllRequests(data.map(req => ({
        ...req,
        grade_level: 0, // Set a default value since it's not in the database
        current_teacher: req.teacher_profiles?.[0] ? {
          name: req.teacher_profiles[0].full_name,
          rating: req.teacher_profiles[0].avg_rating
        } : undefined
      })))
      setCurrentPage(1) // Reset to first page when requests change
    } catch (error) {
      console.error('Error fetching requests:', error instanceof Error ? error.message : JSON.stringify(error))
      setAllRequests([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Separate useEffect for real-time subscription with proper error handling
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client not initialized for real-time subscription')
      return
    }

    let subscription: any = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    const setupSubscription = async () => {
      try {
        // Check if user is authenticated before setting up subscription
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn('User not authenticated, skipping real-time subscription');
          return;
        }

        // Use a more specific channel name with user context
        const channelName = `automated-requests-${user.id}`;
        
        subscription = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'teaching_requests',
            filter: `school_id=eq.${user.id}` // Only listen to changes for this school
          }, (payload) => {
            console.log('Real-time update received:', payload);
            fetchRequests();
          })
          .subscribe((status: string) => {
            console.log('Subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to real-time updates');
              retryCount = 0; // Reset retry count on successful subscription
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Channel error in real-time subscription');
              
              // Retry subscription with exponential backoff
              if (retryCount < maxRetries) {
                retryCount++;
                const retryDelay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
                
                console.log(`Retrying subscription in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
                
                retryTimeout = setTimeout(() => {
                  if (subscription) {
                    subscription.unsubscribe();
                  }
                  setupSubscription();
                }, retryDelay);
              } else {
                console.error('Max retry attempts reached for real-time subscription');
                toast({
                  title: "Real-time Updates Unavailable",
                  description: "Live updates are temporarily unavailable. Please refresh the page manually.",
                  variant: "destructive",
                });
              }
            } else if (status === 'TIMED_OUT') {
              console.warn('Real-time subscription timed out');
              // Attempt to reconnect
              if (subscription) {
                subscription.unsubscribe();
              }
              setupSubscription();
            } else if (status === 'CLOSED') {
              console.log('Real-time subscription closed');
            }
          });

      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };

    // Setup subscription with a small delay to ensure authentication is complete
    const initTimeout = setTimeout(setupSubscription, 1000);

    return () => {
      clearTimeout(initTimeout);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase, fetchRequests, toast])

  const validateForm = (data: FormData): string | null => {
    const currentDate = new Date()
    const selectedDate = new Date(data.date)
    const selectedTime = new Date(`${data.date}T${data.time}`)

    if (selectedDate < currentDate) {
      return "Please select a future date"
    }

    if (selectedTime < currentDate) {
      return "Please select a future time"
    }

    if (!data.subject.trim()) {
      return "Subject is required"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError(null)
    
    const validationError = validateForm(formData)
    if (validationError) {
        setError(validationError)
        toast({
          title: "Form Error",
          description: validationError,
          variant: "destructive"
        })
        return
    }

    setIsSubmitting(true)

    try {
      let subjectToSend = "";
      if (selectedSubject === "other") {
        subjectToSend = customSubject;
      } else {
        subjectToSend = selectedSubject;
      }
      const response = await fetch('/api/automated-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectToSend,
          schedule: {
            date: formData.date,
            time: formData.time
          },
          grade_level: parseInt(formData.grade_level),
          minimum_rating: parseFloat(formData.min_rating)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || await response.text()
        const errorMessage = typeof errorData === 'string' ? errorData : 
                            (errorData && typeof errorData === 'object' && 'message' in errorData) ? 
                            errorData.message : 'Failed to submit request';
        throw new Error(errorMessage)
      }

      // Show success toast
      toast({
        title: "Success!",
        description: "Your automated teacher request has been submitted.",
        variant: "default",
      })

      setFormData({
        subject: '',
        date: '',
        time: '',
        grade_level: '1',
        min_rating: '4.0'
      })
      setSelectedSubject("");
      setCustomSubject("");

      // Refresh requests after successful submission
      fetchRequests()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error submitting request:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
        icon: Loader,
        label: 'Pending'
      },
      accepted: { 
        className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
        icon: CheckCircle,
        label: 'Accepted'
      },
      timeout: { 
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
        icon: Clock,
        label: 'Timeout'
      },
      failed: { 
        className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
        icon: XCircle,
        label: 'Failed'
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.failed
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${config.className}`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Automated Requests</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Set up automated teacher matching based on your requirements and track request history.
        </p>
      </div>

      {/* New Request Form */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="text-xl">Create New Automated Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm dark:bg-red-950/20 dark:border-red-800 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                <select
                  id="subject"
                  value={selectedSubject}
                  onChange={e => {
                    setSelectedSubject(e.target.value);
                    if (e.target.value !== "other") {
                      setCustomSubject("");
                      setFormData({ ...formData, subject: e.target.value });
                    } else {
                      setFormData({ ...formData, subject: "" });
                    }
                  }}
                  required
                  className="field-focus focus-ring h-10 w-full border rounded-md px-2"
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
                    placeholder="Enter custom subject"
                    value={customSubject}
                    onChange={e => {
                      setCustomSubject(e.target.value);
                      setFormData({ ...formData, subject: e.target.value });
                    }}
                    required
                    className="field-focus focus-ring h-10 mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade_level" className="text-sm font-medium">Grade Level</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={value => setFormData({...formData, grade_level: value})}
                >
                  <SelectTrigger className="field-focus focus-ring">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => i + 1).map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="field-focus focus-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium">Time</Label>
                <Input
                  id="time"
                  type="time"
                  required
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                  className="field-focus focus-ring"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="min_rating" className="text-sm font-medium">Minimum Teacher Rating</Label>
                <Select
                  value={formData.min_rating}
                  onValueChange={value => setFormData({...formData, min_rating: value})}
                >
                  <SelectTrigger className="field-focus focus-ring">
                    <SelectValue placeholder="Select minimum rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3.0, 3.5, 4.0, 4.5, 5.0].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating}+ Stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-xl py-6 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Searching for best teachers...
                </>
              ) : (
                'Start Automated Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="text-xl">Request History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading requests...</p>
            </div>
          ) : allRequests.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No automated requests yet</h3>
                <p className="text-muted-foreground">Your request history will appear here</p>
              </div>
            </div>
          ) : (
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
                                {request.subject}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(request.status)}
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(request.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Date:</span>
                              <span className="font-medium">{formatDate(request.schedule.date)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Time:</span>
                              <span className="font-medium">{request.schedule.time}</span>
                            </div>

                            {request.current_teacher && (
                              <div className="flex items-center gap-2 md:col-span-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Teacher:</span>
                                <span className="font-medium">{request.current_teacher.name}</span>
                                <span className="text-muted-foreground">
                                  ({request.current_teacher.rating.toFixed(1)}⭐)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
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
          )}
        </CardContent>
      </Card>

      <Toaster />
    </div>
  )
}
