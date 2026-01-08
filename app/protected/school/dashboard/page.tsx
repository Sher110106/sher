import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Edit, History, Zap, ArrowRight, ClipboardList } from "lucide-react";

export default async function School(){
    const supabase=await createClient();
    const {
        data:{user} 
    }=await supabase.auth.getUser();
    if(!user){
        redirect('/sign-in')
    }
    
    return(
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">School Dashboard</h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Welcome back! Manage your teaching requests and connect with qualified educators.
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {[
                    {
                        href: "/protected/school/teachers",
                        title: "Find Teachers",
                        description: "Search and connect with qualified teachers",
                        icon: Users,
                        color: "text-blue-500",
                        bgColor: "bg-blue-50 dark:bg-blue-950/20"
                    },
                    {
                        href: "/protected/school/requests",
                        title: "My Requests",
                        description: "Track and manage your sent requests",
                        icon: ClipboardList,
                        color: "text-rose-500",
                        bgColor: "bg-rose-50 dark:bg-rose-950/20"
                    },
                    {
                        href: "/protected/school/automated-requests",
                        title: "Auto Requests",
                        description: "Automate teacher finding process",
                        icon: Zap,
                        color: "text-amber-500",
                        bgColor: "bg-amber-50 dark:bg-amber-950/20"
                    },
                    {
                        href: "/protected/school/edit",
                        title: "Edit Profile",
                        description: "Update your school information",
                        icon: Edit,
                        color: "text-green-500",
                        bgColor: "bg-green-50 dark:bg-green-950/20"
                    },
                    {
                        href: "/protected/school/past_classes",
                        title: "Past Classes",
                        description: "View completed teaching sessions",
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

            {/* Getting Started Section */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-xl">Getting Started</CardTitle>
                    <CardDescription>
                        New to Quad? Here's how to make the most of our platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4">
                        {[
                            "Search for qualified teachers using our advanced filters",
                            "Send requests directly to teachers that match your needs", 
                            "Use automated requests for instant teacher matching",
                            "Review past classes and provide ratings for quality assurance"
                        ].map((step, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                                    {index + 1}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                    
                    <div className="pt-4">
                        <Link href="/protected/school/teachers">
                            <Button className="rounded-xl group">
                                Start Finding Teachers
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
};