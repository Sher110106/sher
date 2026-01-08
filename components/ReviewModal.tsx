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
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  teachingRequestId: string;
  teacherName: string;
  onSuccess?: () => void;
}

export function ReviewModal({
  isOpen,
  onOpenChange,
  classId,
  teachingRequestId,
  teacherName,
  onSuccess
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teaching_request_id: teachingRequestId,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Reset state
      setRating(0);
      setComment("");
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-primary" />
            Review Your Session
          </DialogTitle>
          <DialogDescription>
            How was your session with <strong>{teacherName}</strong>? Your feedback helps us maintain quality teaching.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Star Selection */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                  onMouseEnter={() => setHoveredRating(num)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => {
                    setRating(num);
                    setError(null);
                  }}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoveredRating || rating) >= num
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground italic h-5">
              {hoveredRating === 1 || (rating === 1 && !hoveredRating) ? "Poor" :
               hoveredRating === 2 || (rating === 2 && !hoveredRating) ? "Fair" :
               hoveredRating === 3 || (rating === 3 && !hoveredRating) ? "Good" :
               hoveredRating === 4 || (rating === 4 && !hoveredRating) ? "Very Good" :
               hoveredRating === 5 || (rating === 5 && !hoveredRating) ? "Excellent!" : ""}
            </p>
          </div>

          {/* Comment Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Comments (Optional)</label>
            <Textarea
              placeholder="What went well? Any areas for improvement?"
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              disabled={isSubmitting}
              className="resize-none h-24"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
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
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
