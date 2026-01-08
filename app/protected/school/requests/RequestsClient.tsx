'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  User, 
  Ban, 
  RefreshCw, 
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Clock3
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { CancelSessionModal } from '@/components/CancelSessionModal';
import { RescheduleModal } from '@/components/RescheduleModal';
import { RatingDisplay } from '@/components/RatingDisplay';

interface TeachingRequest {
    id: string;
    teacher_id: string;
    school_id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    subject: string;
    schedule: { date: string; time: string };
    created_at: string;
    cancelled_at?: string;
    cancelled_by?: string;
    cancellation_reason?: string;
    teacher: {
        full_name: string;
        subjects: string[];
        avg_rating: number | null;
        review_count: number | null;
    };
}

interface SchoolRequestsClientProps {
    initialRequests: TeachingRequest[];
    userId: string;
}

export default function SchoolRequestsClient({ initialRequests, userId }: SchoolRequestsClientProps) {
    const [requests, setRequests] = useState<TeachingRequest[]>(initialRequests);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<TeachingRequest | null>(null);
    
    const supabase = createClient();

    // Subscribe to real-time updates
    useEffect(() => {
        const channel = supabase
            .channel('school_requests')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'teaching_requests',
                    filter: `school_id=eq.${userId}`
                },
                async (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setRequests(prev => prev.map(req => 
                            req.id === payload.new.id ? { ...req, ...payload.new } : req
                        ));
                    } else if (payload.eventType === 'INSERT') {
                        window.location.reload(); 
                    }
                }
            )
            .subscribe();

        return () => { channel.unsubscribe(); };
    }, [supabase, userId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock3 className="h-4 w-4 text-amber-500" />;
            case 'accepted': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'cancelled': return <Ban className="h-4 w-4 text-gray-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-4">
            {requests.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">You haven't sent any teaching requests yet.</p>
                    <Button variant="link" className="mt-2" asChild>
                        <a href="/protected/school/teachers">Find teachers to get started</a>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <Card key={request.id} className="overflow-hidden group hover:shadow-md transition-all border-border/50">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{request.teacher.full_name}</h3>
                                                    <RatingDisplay 
                                                        rating={request.teacher.avg_rating || 0} 
                                                        count={request.teacher.review_count || 0}
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="flex items-center gap-1.5 py-1">
                                                {getStatusIcon(request.status)}
                                                <span className="capitalize">{request.status}</span>
                                            </Badge>
                                        </div>

                                        {request.status === 'cancelled' && (
                                            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Request Cancelled</p>
                                                    <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
                                                        {request.cancellation_reason || 'No reason provided'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Subject:</span>
                                                <span className="font-medium">{request.subject}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Date:</span>
                                                <span className="font-medium">{new Date(request.schedule.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Time:</span>
                                                <span className="font-medium">{request.schedule.time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 lg:flex-col lg:w-40 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-6">
                                        {(request.status === 'pending' || request.status === 'accepted') && (
                                            <>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="flex-1 lg:w-full"
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowRescheduleModal(true);
                                                    }}
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                                    Reschedule
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="flex-1 lg:w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowCancelModal(true);
                                                    }}
                                                >
                                                    <Ban className="h-3.5 w-3.5 mr-2" />
                                                    Cancel
                                                </Button>
                                            </>
                                        )}
                                        {request.status === 'accepted' && (
                                             <Button variant="default" size="sm" className="flex-1 lg:w-full" asChild>
                                                <a href="/protected/school/past_classes">View Class</a>
                                             </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CancelSessionModal 
                isOpen={showCancelModal}
                onOpenChange={setShowCancelModal}
                requestId={selectedRequest?.id || ''}
            />

            {selectedRequest && (
                <RescheduleModal 
                    isOpen={showRescheduleModal}
                    onOpenChange={setShowRescheduleModal}
                    requestId={selectedRequest.id}
                    currentSchedule={selectedRequest.schedule}
                />
            )}
        </div>
    );
}
