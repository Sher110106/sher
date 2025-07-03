'use client'
import { useState, useEffect } from "react";
import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { SmtpMessage } from "../smtp-message";
import { Users, GraduationCap } from "lucide-react";

export default function Signup(props: { searchParams: Promise<Message>; }) {
  const [searchParams, setSearchParams] = useState<Message | null>(null);
  const [selectedRole, setSelectedRole] = useState<'school' | 'teacher' | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSearchParams() {
      const params = await props.searchParams;
      setSearchParams(params);
    }
    fetchSearchParams();
  }, [props.searchParams]);

  if (searchParams && "message" in searchParams) {
    return (
      <>
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <FormMessage message={searchParams} />
          </CardContent>
        </Card>
      </>
    );
  }

  const handleRoleChange = (value: 'school' | 'teacher') => {
    setSelectedRole(value);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(value)) {
        return prev.filter((subject: string) => subject !== value);
      } else if (prev.length < 3) {
        return [...prev, value];
      }
      return prev;
    });
  };

  const handleQualificationChange = (value: string) => {
    setSelectedQualifications((prev) => {
      if (prev.includes(value)) {
        return prev.filter((qual: string) => qual !== value);
      }
      return [...prev, value];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.target as HTMLFormElement);
      await signUpAction(formData);
    } catch (error) {
      console.error("An error occurred during sign-up:", error);
    }
  };

  return (
    <>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 -z-10" />
      
      <div className="w-full max-w-lg space-y-6">
        <Card className="animate-fade-in">
          <CardHeader className="text-center space-y-6">
            <div className="flex justify-center">
              <Image
                src="/quad_logo.png"
                alt="Quad"
                width={60}
                height={60}
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
              <p className="text-muted-foreground">
                Join the Quad community today
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input 
                    name="email" 
                    type="email"
                    placeholder="you@example.com" 
                    required 
                    className="field-focus focus-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Create a secure password"
                    minLength={6}
                    required
                    className="field-focus focus-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">I am a...</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedRole === 'school' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleRoleChange('school')}
                  >
                    <CardContent className="p-4 text-center space-y-3">
                      <Users className="h-8 w-8 mx-auto text-primary" />
                      <div>
                        <p className="font-medium">School</p>
                        <p className="text-xs text-muted-foreground">Find qualified teachers</p>
                      </div>
                      <input
                        type="radio"
                        name="role"
                        value="school"
                        checked={selectedRole === 'school'}
                        onChange={() => handleRoleChange('school')}
                        className="sr-only"
                      />
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedRole === 'teacher' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleRoleChange('teacher')}
                  >
                    <CardContent className="p-4 text-center space-y-3">
                      <GraduationCap className="h-8 w-8 mx-auto text-primary" />
                      <div>
                        <p className="font-medium">Teacher</p>
                        <p className="text-xs text-muted-foreground">Offer your expertise</p>
                      </div>
                      <input
                        type="radio"
                        name="role"
                        value="teacher"
                        checked={selectedRole === 'teacher'}
                        onChange={() => handleRoleChange('teacher')}
                        className="sr-only"
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* School-specific fields */}
              {selectedRole === 'school' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-semibold text-foreground">School Information</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName" className="text-sm font-medium">School Name</Label>
                      <Input name="schoolName" placeholder="Your School Name" required className="field-focus focus-ring" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium">State</Label>
                        <Input name="state" placeholder="State" required className="field-focus focus-ring" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district" className="text-sm font-medium">District</Label>
                        <Input name="district" placeholder="District" required className="field-focus focus-ring" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cluster" className="text-sm font-medium">Cluster</Label>
                        <Input name="cluster" placeholder="Cluster" required className="field-focus focus-ring" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="block" className="text-sm font-medium">Block</Label>
                        <Input name="block" placeholder="Block" required className="field-focus focus-ring" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher-specific fields */}
              {selectedRole === 'teacher' && (
                <div className="space-y-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-foreground">Teacher Information</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                      <Input name="fullName" placeholder="Your Full Name" required className="field-focus focus-ring" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="teachingGrade" className="text-sm font-medium">Teaching Grade</Label>
                        <Input
                          type="number"
                          name="teachingGrade"
                          placeholder="Grade"
                          min="1"
                          max="12"
                          required
                          className="field-focus focus-ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experienceYears" className="text-sm font-medium">Experience (Years)</Label>
                        <Input 
                          name="experienceYears" 
                          placeholder="Years" 
                          type="number"
                          min="0"
                          required 
                          className="field-focus focus-ring"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Subjects (Max 3)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Math', 'Science', 'English', 'History'].map((subject) => (
                          <Label key={subject} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              name="subjects"
                              value={subject.toLowerCase()}
                              checked={selectedSubjects.includes(subject.toLowerCase())}
                              onCheckedChange={() => handleSubjectChange(subject.toLowerCase())}
                            />
                            <span className="text-sm">{subject}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Qualifications</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['PhD', 'Masters', 'Bachelors', 'Diploma', 'Other'].map((qual) => (
                          <Label key={qual} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              name="qualifications"
                              value={qual.toLowerCase()}
                              checked={selectedQualifications.includes(qual.toLowerCase())}
                              onCheckedChange={() => handleQualificationChange(qual.toLowerCase())}
                            />
                            <span className="text-sm">{qual}</span>
                          </Label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <SubmitButton 
                  pendingText="Creating account..." 
                  className="w-full rounded-xl py-6 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Create account
                </SubmitButton>
                
                {searchParams && <FormMessage message={searchParams} />}
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  className="text-primary font-medium hover:text-primary/80 transition-colors duration-200" 
                  href="/sign-in"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <SmtpMessage />
        </div>
      </div>
    </>
  );
}