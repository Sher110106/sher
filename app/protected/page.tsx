import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, GraduationCap, ArrowRight } from "lucide-react";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check for user role in database
  const { data: schoolProfile } = await supabase
    .from('school_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: teacherProfile } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Redirect based on role
  if (schoolProfile) {
    redirect('/protected/school/dashboard');
  } else if (teacherProfile) {
    redirect('/protected/teacher/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome to Quad</h1>
          <p className="text-lg text-muted-foreground">
            Complete your profile setup to get started
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/protected/school/dashboard">
            <Card interactive className="h-full group animate-slide-up">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    I'm a School
                  </CardTitle>
                  <CardDescription className="text-base">
                    Find qualified teachers for your institution
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Search and filter qualified teachers</li>
                  <li>• Send teaching requests instantly</li>
                  <li>• Automate teacher matching</li>
                  <li>• Track session recordings</li>
                </ul>
                <div className="flex items-center justify-center gap-2 text-primary font-medium">
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/protected/teacher/dashboard">
            <Card interactive className="h-full group animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    I'm a Teacher
                  </CardTitle>
                  <CardDescription className="text-base">
                    Share your expertise with schools in need
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Receive teaching requests</li>
                  <li>• Manage your schedule</li>
                  <li>• Update your qualifications</li>
                  <li>• View past class sessions</li>
                </ul>
                <div className="flex items-center justify-center gap-2 text-primary font-medium">
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <InfoIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Need help setting up?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Contact us at{" "}
                  <a href="mailto:sher.singh.ug23@plaksha.edu.in" className="text-primary hover:underline">
                    sher.singh.ug23@plaksha.edu.in
                  </a>{" "}
                  for assistance with your profile setup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}