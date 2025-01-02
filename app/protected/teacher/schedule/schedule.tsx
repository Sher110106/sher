'use client'

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface TimeSlotInputProps {
  teacherId: string;
  onSubmitSuccess?: (data: any) => void;
}

const TimeSlotInput = ({ teacherId, onSubmitSuccess }: TimeSlotInputProps) => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  
  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const addTimeSlot = () => {
    setAvailability(prev => [...prev, { day: '', startTime: '', endTime: '' }]);
  };

  const removeTimeSlot = (index: number) => {
    setAvailability(prev => prev.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (
    index: number, 
    field: keyof TimeSlot, 
    value: string
  ) => {
    setAvailability(prev => prev.map((slot, i) => {
      if (i === index) {
        return { ...slot, [field]: value };
      }
      return slot;
    }));
  };

  const getFormattedData = () => {
    return {
      schedule: availability.map(slot => ({
        day: slot.day,
        time_range: {
          start: slot.startTime,
          end: slot.endTime
        }
      }))
    };
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formattedData = getFormattedData();
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) throw new Error('Unable to get user email');
  
      // First get existing availability
      const { data: existingProfile } = await supabase
        .from('teacher_profiles')
        .select('availability')
        .eq('id', teacherId)
        .single();
  
      // Combine existing and new availability
      const combinedAvailability = {
        schedule: [
          ...(existingProfile?.availability?.schedule || []),
          ...formattedData.schedule
        ]
      };
  
      const { error } = await supabase
        .from('teacher_profiles')
        .upsert({
          id: teacherId,
          email: user.email,
          availability: combinedAvailability,
          updated_at: new Date().toISOString()
        });
  
      if (error) throw error;
      if (onSubmitSuccess) onSubmitSuccess(combinedAvailability);
      
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Teaching Availability</h3>
            <Button onClick={addTimeSlot} variant="outline" size="sm">
              Add Time Slot
            </Button>
          </div>

          {availability.map((slot, index) => (
            <div key={index} className="flex gap-4 items-center">
              <Select
                value={slot.day}
                onValueChange={(value) => updateTimeSlot(index, 'day', value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={slot.startTime}
                onValueChange={(value) => updateTimeSlot(index, 'startTime', value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={slot.endTime}
                onValueChange={(value) => updateTimeSlot(index, 'endTime', value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTimeSlot(index)}
                className="text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || availability.length === 0}
            className="mt-4"
          >
            {isSubmitting ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSlotInput;