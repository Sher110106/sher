'use client'

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { createClient } from "@/utils/supabase/client"

interface AutomatedRequest {
  id: string
  subject: string
  schedule: {
    date: string
    time: string
  }
  grade_level: number
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

export default function AutomatedRequestsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<AutomatedRequest[]>([])
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    date: '',
    time: '',
    grade_level: '1',
    min_rating: '4.0'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teaching_requests')
        .select(`
          id,
          subject,
          schedule,
          grade_level,
          status,
          teacher_profiles(full_name, avg_rating),
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequests(data.map(req => ({
        ...req,
        current_teacher: req.teacher_profiles?.[0] ? {
          name: req.teacher_profiles[0].full_name,
          rating: req.teacher_profiles[0].avg_rating
        } : undefined
      })))
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        title: "Error",
        description: "Failed to fetch requests",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchRequests()
    
    const subscription = supabase
      .channel('auto-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teaching_requests'
      }, () => fetchRequests())
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [fetchRequests, supabase])

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
    
    const validationError = validateForm(formData)
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/automated-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          schedule: {
            date: formData.date,
            time: formData.time
          },
          grade_level: parseInt(formData.grade_level),
          minimum_rating: parseFloat(formData.min_rating)
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      toast({
        title: "Request submitted",
        description: "We're finding the best teacher for your needs",
        variant: "default"
      })

      setFormData({
        subject: '',
        date: '',
        time: '',
        grade_level: '1',
        min_rating: '4.0'
      })

      // Refresh requests after successful submission
      fetchRequests()

    } catch (error) {
      
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      timeout: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-md text-sm ${styles[status as keyof typeof styles] || ''}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>New Automated Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  required
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  placeholder="Mathematics"
                />
              </div>

              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={value => setFormData({...formData, grade_level: value})}
                >
                  <SelectTrigger>
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
                <Label>Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  required
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <Select
                  value={formData.min_rating}
                  onValueChange={value => setFormData({...formData, min_rating: value})}
                >
                  <SelectTrigger>
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
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Searching for best teachers...' : 'Start Automated Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{request.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      Grade {request.grade_level} • 
                      {new Date(request.schedule.date).toLocaleDateString()} • 
                      {request.schedule.time}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {request.current_teacher && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">Current Teacher:</span>
                    <span>{request.current_teacher.name}</span>
                    <span className="text-muted-foreground">
                      ({request.current_teacher.rating.toFixed(1)}⭐)
                    </span>
                  </div>
                )}

                <div className="mt-2 text-sm text-muted-foreground">
                  Created {new Date(request.created_at).toLocaleString()}
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No automated requests yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Toaster />
    </div>
  )
}
