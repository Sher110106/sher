// app/(dashboard)/teacher/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TeachingRequestsWrapper from '@/components/TeachingRequestsWrapper';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Edit, History, ArrowRight } from "lucide-react";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/sign-in')
  }
  
  const { data: requests } = await supabase
    .from('teaching_requests')
    .select(`
      *,
      school:school_profiles(
        school_name,
        state,
        district,
        cluster,
        block
      )
    `)
    .eq('teacher_id', user.id);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Manage your teaching schedule and connect with schools that need your expertise.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            href: "/protected/teacher/schedule",
            title: "Manage Schedule",
            description: "Update your availability and time slots",
            icon: Calendar,
            color: "text-blue-500",
            bgColor: "bg-blue-50 dark:bg-blue-950/20"
          },
          {
            href: "/protected/teacher/edit",
            title: "Edit Profile",
            description: "Update your teaching details and qualifications",
            icon: Edit,
            color: "text-green-500",
            bgColor: "bg-green-50 dark:bg-green-950/20"
          },
          {
            href: "/protected/teacher/past_classes",
            title: "Past Classes",
            description: "View your teaching history and session recordings",
            icon: History,
            color: "text-purple-500",
            bgColor: "bg-purple-50 dark:bg-purple-950/20"
          }
        ].map((action, index) => (
          <Link key={action.href} href={action.href}>
            <Card 
              interactive 
              className="h-full group animate-slide-up" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Teaching Requests Section */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="text-2xl">Teaching Requests</CardTitle>
          <CardDescription>
            Review and respond to requests from schools looking for your expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeachingRequestsWrapper 
            initialRequests={requests || []}
            userId={user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}