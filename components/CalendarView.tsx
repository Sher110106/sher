'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, XCircle } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TeachingRequest {
  id: string;
  subject: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  schedule: {
    date: string;
    time: string;
  } | null;
  created_at: string;
  school?: {
    school_name: string;
  };
  teacher?: {
    name: string;
  };
  meeting_link?: string;
  google_event_id?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: TeachingRequest;
}

interface CalendarViewProps {
  requests: TeachingRequest[];
  userType: 'teacher' | 'school';
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-400' },
  accepted: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-400' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-400' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-400' },
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'accepted':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'cancelled':
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

export default function CalendarView({ requests, userType }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const events: CalendarEvent[] = useMemo(() => {
    return requests
      .filter(req => req.schedule?.date && req.schedule?.time)
      .map(req => {
        const dateStr = req.schedule!.date;
        const timeStr = req.schedule!.time;
        
        // Parse date and time
        const [hours, minutes] = timeStr.split(':').map(Number);
        const startDate = new Date(dateStr);
        startDate.setHours(hours || 9, minutes || 0, 0, 0);
        
        // Assume 1 hour sessions
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        const otherParty = userType === 'teacher' 
          ? req.school?.school_name || 'Unknown School'
          : req.teacher?.name || 'Unknown Teacher';

        return {
          id: req.id,
          title: `${req.subject} - ${otherParty}`,
          start: startDate,
          end: endDate,
          resource: req,
        };
      });
  }, [requests, userType]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const colors = statusColors[event.resource.status] || statusColors.pending;
    return {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
      },
      className: `${colors.bg} ${colors.text} ${colors.border} border-l-4 rounded-md px-2 py-1 text-xs font-medium`,
    };
  };

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    if (action === 'PREV') {
      if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
      else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
      else newDate.setDate(newDate.getDate() - 1);
    } else if (action === 'NEXT') {
      if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
      else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
      else newDate.setDate(newDate.getDate() + 1);
    } else {
      setCurrentDate(new Date());
      return;
    }
    setCurrentDate(newDate);
  };

  const CustomToolbar = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleNavigate('PREV')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleNavigate('TODAY')}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleNavigate('NEXT')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold ml-2">
          {format(currentDate, view === 'month' ? 'MMMM yyyy' : view === 'week' ? "'Week of' MMM d, yyyy" : 'EEEE, MMM d, yyyy')}
        </h2>
      </div>
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        {(['month', 'week', 'day'] as View[]).map((v) => (
          <Button
            key={v}
            variant={view === v ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView(v)}
            className="capitalize"
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );

  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{acceptedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${events.some(e => e.resource.google_event_id) ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>
                <p className="text-sm font-medium">Google Sync</p>
                <p className="text-xs text-muted-foreground">
                  {events.filter(e => e.resource.google_event_id).length} synced
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <CustomToolbar />
          <div className="h-[600px] calendar-container">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={setCurrentDate}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event) => setSelectedEvent(event)}
              toolbar={false}
              popup
              selectable={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        {Object.entries(statusColors).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded ${colors.bg} ${colors.border} border`} />
            <span className="capitalize text-muted-foreground">{status}</span>
          </div>
        ))}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StatusIcon status={selectedEvent?.resource.status || ''} />
              {selectedEvent?.resource.subject}
            </DialogTitle>
            <DialogDescription>
              Session details
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(selectedEvent.start, 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{format(selectedEvent.start, 'p')} - {format(selectedEvent.end, 'p')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  {userType === 'teacher' ? 'School' : 'Teacher'}
                </p>
                <p className="font-medium">
                  {userType === 'teacher' 
                    ? selectedEvent.resource.school?.school_name 
                    : selectedEvent.resource.teacher?.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Status:</p>
                <Badge 
                  variant="outline" 
                  className={`${statusColors[selectedEvent.resource.status].bg} ${statusColors[selectedEvent.resource.status].text}`}
                >
                  {selectedEvent.resource.status}
                </Badge>
              </div>

              {selectedEvent.resource.google_event_id && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Synced with Google Calendar
                </div>
              )}

              {selectedEvent.resource.meeting_link && (
                <Button asChild className="w-full">
                  <a href={selectedEvent.resource.meeting_link} target="_blank" rel="noopener noreferrer">
                    Join Meeting
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom styles for the calendar */}
      <style jsx global>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }
        .calendar-container .rbc-header {
          padding: 8px;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .calendar-container .rbc-today {
          background-color: hsl(var(--primary) / 0.1);
        }
        .calendar-container .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.3);
        }
        .calendar-container .rbc-event {
          font-size: 0.75rem;
        }
        .calendar-container .rbc-month-view,
        .calendar-container .rbc-time-view {
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
        }
        .calendar-container .rbc-month-row + .rbc-month-row,
        .calendar-container .rbc-day-bg + .rbc-day-bg {
          border-color: hsl(var(--border));
        }
        .calendar-container .rbc-header + .rbc-header {
          border-color: hsl(var(--border));
        }
        .calendar-container .rbc-timeslot-group {
          border-color: hsl(var(--border));
        }
        .calendar-container .rbc-time-content {
          border-color: hsl(var(--border));
        }
        .calendar-container .rbc-time-header-content {
          border-color: hsl(var(--border));
        }
        .calendar-container .rbc-agenda-view table.rbc-agenda-table {
          border: 1px solid hsl(var(--border));
        }
        .calendar-container .rbc-agenda-view table.rbc-agenda-table tbody > tr > td + td {
          border-color: hsl(var(--border));
        }
        .calendar-container .rbc-agenda-view table.rbc-agenda-table tbody > tr + tr {
          border-color: hsl(var(--border));
        }
      `}</style>
    </div>
  );
}
