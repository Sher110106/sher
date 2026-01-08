'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Loader2 } from "lucide-react";

interface RescheduleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  currentSchedule: { date: string; time: string };
  onSuccess?: () => void;
}

export function RescheduleModal({
  isOpen,
  onOpenChange,
  requestId,
  currentSchedule,
  onSuccess
}: RescheduleModalProps) {
  const [date, setDate] = useState(currentSchedule.date);
  const [time, setTime] = useState(currentSchedule.time);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReschedule = async () => {
    if (date === currentSchedule.date && time === currentSchedule.time) {
        setError("Please choose a different time than the current one.");
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/teaching-requests/${requestId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            new_schedule: { date, time },
            reason 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to propose reschedule");
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error proposing reschedule:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Propose Reschedule
          </DialogTitle>
          <DialogDescription>
            Propose a new date and time for this session. The other party will need to accept the change.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" /> New Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> New Time
              </label>
              <Input
                type="text"
                placeholder="e.g. 10:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Rescheduling</label>
            <Textarea
              placeholder="Provide a reason for the change..."
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={isSubmitting || (date === currentSchedule.date && time === currentSchedule.time)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Proposal...
              </>
            ) : (
              "Send Proposal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
