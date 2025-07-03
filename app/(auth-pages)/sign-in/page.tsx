import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 -z-10" />
      
      <Card className="w-full max-w-md animate-fade-in">
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
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <p className="text-muted-foreground">
              Sign in to your Quad account
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form className="space-y-6">
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    className="text-sm text-primary hover:text-primary/80 transition-colors duration-200"
                    href="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  className="field-focus focus-ring"
                />
              </div>
            </div>

            <div className="space-y-4">
              <SubmitButton 
                pendingText="Signing in..." 
                formAction={signInAction}
                className="w-full rounded-xl py-6 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign in
              </SubmitButton>
              
              <FormMessage message={searchParams} />
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link 
                className="text-primary font-medium hover:text-primary/80 transition-colors duration-200" 
                href="/sign-up"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
