'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  User, 
  Calendar, 
  Video,
  GraduationCap,
  BookOpen,
  Award,
  Clock
} from "lucide-react";
import { useRouter } from 'next/navigation';

interface TeacherProfile {
  id: string;
  full_name?: string;
  subjects?: string[];
  qualifications?: string[];
  experience_years?: number;
  availability?: { schedule: Array<{ day: string; time_range: { start: string; end: string } }> };
  onboarding_completed?: boolean;
}

interface OnboardingWizardProps {
  userId: string;
  initialProfile: TeacherProfile | null;
  isGoogleConnected: boolean;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'profile', title: 'Profile', icon: User },
  { id: 'availability', title: 'Availability', icon: Calendar },
  { id: 'google', title: 'Google Calendar', icon: Video },
  { id: 'complete', title: 'All Done!', icon: CheckCircle2 },
];

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
  'Hindi', 'Social Science', 'Computer Science', 'Economics', 
  'Geography', 'History', 'Political Science'
];

const QUALIFICATIONS = [
  'B.Ed', 'M.Ed', 'B.A.', 'M.A.', 'B.Sc.', 'M.Sc.', 
  'PhD', 'D.El.Ed', 'TET Qualified', 'CTET Qualified'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export default function OnboardingWizard({ userId, initialProfile, isGoogleConnected }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(isGoogleConnected);
  
  // Form state
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [subjects, setSubjects] = useState<string[]>(initialProfile?.subjects || []);
  const [qualifications, setQualifications] = useState<string[]>(initialProfile?.qualifications || []);
  const [experienceYears, setExperienceYears] = useState(initialProfile?.experience_years || 0);
  const [availability, setAvailability] = useState<{ day: string; time: string }[]>(
    initialProfile?.availability?.schedule?.map(s => ({ day: s.day, time: s.time_range.start })) || []
  );

  // Check for Google OAuth success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth') === 'success') {
      setGoogleConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const toggleSubject = (subject: string) => {
    setSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleQualification = (qual: string) => {
    setQualifications(prev => 
      prev.includes(qual) 
        ? prev.filter(q => q !== qual)
        : [...prev, qual]
    );
  };

  const toggleAvailability = (day: string, time: string) => {
    setAvailability(prev => {
      const exists = prev.find(a => a.day === day && a.time === time);
      if (exists) {
        return prev.filter(a => !(a.day === day && a.time === time));
      }
      return [...prev, { day, time }];
    });
  };

  const isSlotSelected = (day: string, time: string) => {
    return availability.some(a => a.day === day && a.time === time);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const availabilityFormatted = {
        schedule: availability.map(a => ({
          day: a.day,
          time_range: { start: a.time, end: a.time }
        }))
      };

      const response = await fetch('/api/teachers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          subjects,
          qualifications,
          experience_years: experienceYears,
          availability: availabilityFormatted
        })
      });

      if (!response.ok) throw new Error('Failed to save profile');
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teachers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true })
      });

      if (!response.ok) throw new Error('Failed to complete onboarding');
      router.push('/protected/teacher/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 || currentStep === 2) {
      // Save profile after Profile or Availability step
      const success = await saveProfile();
      if (!success) return;
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const connectGoogle = () => {
    window.location.href = `/api/auth/google?teacherId=${userId}`;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome - always can proceed
      case 1: return fullName.length > 0 && subjects.length > 0 && qualifications.length > 0;
      case 2: return availability.length > 0;
      case 3: return true; // Google is optional
      case 4: return true; // Complete
      default: return false;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-8 py-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 animate-pulse">
              <GraduationCap className="w-12 h-12 text-primary-foreground" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Welcome to Quad!</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Let's get your teaching profile set up so schools can find you and book your expertise.
              </p>
            </div>
            <div className="grid gap-4 max-w-sm mx-auto text-left">
              {[
                { icon: BookOpen, text: 'Add your subjects & qualifications' },
                { icon: Clock, text: 'Set your availability' },
                { icon: Video, text: 'Connect Google Calendar' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 1: // Profile
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Subjects You Teach
              </Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(subject => (
                  <Badge
                    key={subject}
                    variant={subjects.includes(subject) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105 py-1.5 px-3"
                    onClick={() => toggleSubject(subject)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Award className="w-4 h-4" /> Qualifications
              </Label>
              <div className="flex flex-wrap gap-2">
                {QUALIFICATIONS.map(qual => (
                  <Badge
                    key={qual}
                    variant={qualifications.includes(qual) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105 py-1.5 px-3"
                    onClick={() => toggleQualification(qual)}
                  >
                    {qual}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience" className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Years of Experience
              </Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                className="h-12 w-32"
              />
            </div>
          </div>
        );

      case 2: // Availability
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Set Your Availability
              </Label>
              <p className="text-sm text-muted-foreground">
                Click on time slots when you're available to teach
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[600px] grid grid-cols-7 gap-1">
                <div className="font-semibold text-xs text-muted-foreground p-2"></div>
                {DAYS.map(day => (
                  <div key={day} className="font-semibold text-xs text-center p-2 text-muted-foreground">
                    {day.slice(0, 3)}
                  </div>
                ))}
                
                {TIME_SLOTS.map(time => (
                  <React.Fragment key={time}>
                    <div className="text-xs text-muted-foreground p-2 text-right">
                      {time}
                    </div>
                    {DAYS.map(day => (
                      <button
                        key={`${day}-${time}`}
                        onClick={() => toggleAvailability(day, time)}
                        className={`
                          h-8 rounded-md transition-all text-xs font-medium
                          ${isSlotSelected(day, time)
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                          }
                        `}
                      >
                        {isSlotSelected(day, time) && <CheckCircle2 className="w-3 h-3 mx-auto" />}
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {availability.length} time slot{availability.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        );

      case 3: // Google Calendar
        return (
          <div className="text-center space-y-8 py-6">
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${
              googleConnected 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-muted'
            }`}>
              <Video className={`w-10 h-10 ${googleConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>

            {googleConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Google Calendar Connected!</span>
                </div>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  When you accept teaching requests, Google Meet links will be created automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Connect Google Calendar</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    This allows us to create Google Meet links automatically when you accept requests.
                  </p>
                </div>

                <Button 
                  onClick={connectGoogle}
                  size="lg"
                  className="gap-2"
                >
                  <Video className="w-4 h-4" />
                  Connect Google Calendar
                </Button>

                <p className="text-xs text-muted-foreground">
                  You can also do this later from your dashboard.
                </p>
              </div>
            )}
          </div>
        );

      case 4: // Complete
        return (
          <div className="text-center space-y-8 py-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-green-500/20">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">You're All Set!</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Your teaching profile is ready. Schools can now find you and send teaching requests.
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button 
                onClick={completeOnboarding} 
                size="lg" 
                className="w-full gap-2"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Go to Dashboard'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${index < currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : index === currentStep
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {index < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="shadow-xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">{STEPS[currentStep].title}</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="gap-2"
              >
                {loading ? 'Saving...' : currentStep === 3 ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
