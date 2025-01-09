'use client'
import { useState, useEffect } from "react";
import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

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
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col min-w-64 max-w-64 mx-auto"
      >
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm text text-foreground">
          Already have an account?{" "}
          <Link className="text-primary font-medium underline" href="/sign-in">
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
          />
          <Label htmlFor="role">Role</Label>
          <div className="flex gap-2">
            <Label htmlFor="schoolCheckbox" className="flex items-center gap-2">
              <Input
                type="checkbox"
                id="schoolCheckbox"
                name="role"
                value="school"
                checked={selectedRole === 'school'}
                onChange={() => handleRoleChange('school')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              School
            </Label>
            <Label htmlFor="teacherCheckbox" className="flex items-center gap-2">
              <Input
                type="checkbox"
                id="teacherCheckbox"
                name="role"
                value="teacher"
                checked={selectedRole === 'teacher'}
                onChange={() => handleRoleChange('teacher')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Teacher
            </Label>
          </div>

          {selectedRole === 'school' && (
            <>
              <Label htmlFor="schoolName">School Name</Label>
              <Input name="schoolName" placeholder="Your School Name" required />
              
              <Label htmlFor="state">State</Label>
              <Input name="state" placeholder="State" required />
              
              <Label htmlFor="district">District</Label>
              <Input name="district" placeholder="District" required />
              
              <Label htmlFor="cluster">Cluster</Label>
              <Input name="cluster" placeholder="Cluster" required />
              
              <Label htmlFor="block">Block</Label>
              <Input name="block" placeholder="Block" required />


              
            </>
          )}

          {selectedRole === 'teacher' && (
            <>
              <Label htmlFor="fullName">Full Name</Label>
              <Input name="fullName" placeholder="Your Full Name" required />

              <Label htmlFor="teachingGrade">Grade</Label>
              <Input
                type="number"
                name="teachingGrade"
                placeholder="Teaching Grade"
                min="1"
                max="12"
                required
              />

              <Label htmlFor="subjects">Subjects (Max 3)</Label>
              <div className="flex flex-col gap-2">
                {['Math', 'Science', 'English', 'History'].map((subject) => (
                  <Label key={subject} htmlFor={subject.toLowerCase()} className="flex items-center gap-2">
                    <Input
                      type="checkbox"
                      id={subject.toLowerCase()}
                      name="subjects"
                      value={subject.toLowerCase()}
                      checked={selectedSubjects.includes(subject.toLowerCase())}
                      onChange={() => handleSubjectChange(subject.toLowerCase())}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {subject}
                  </Label>
                ))}
              </div>

              <Label htmlFor="qualifications">Qualifications</Label>
              <div className="flex flex-col gap-2">
                {['PhD', 'Masters', 'Bachelors', 'Diploma', 'Other'].map((qual) => (
                  <Label key={qual} htmlFor={qual.toLowerCase()} className="flex items-center gap-2">
                    <Input
                      type="checkbox"
                      id={qual.toLowerCase()}
                      name="qualifications"
                      value={qual.toLowerCase()}
                      checked={selectedQualifications.includes(qual.toLowerCase())}
                      onChange={() => handleQualificationChange(qual.toLowerCase())}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {qual}
                  </Label>
                ))}
              </div>

              <Label htmlFor="experienceYears">Experience Years</Label>
              <Input 
                name="experienceYears" 
                placeholder="Experience Years" 
                type="number"
                min="0"
                required 
              />
            </>
          )}

          <SubmitButton pendingText="Signing up...">
            Sign up
          </SubmitButton>
          {searchParams && <FormMessage message={searchParams} />}
        </div>
      </form>
      <SmtpMessage />
    </>
  );
}