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
      
      <Card className="w-full max-w-sm sm:max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-4 sm:space-y-6 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center">
            <Image
              src="/quad_logo.png"
              alt="Quad"
              width={48}
              height={48}
              className="sm:w-[60px] sm:h-[60px] rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground">
              Sign in to your Quad account
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <form className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input 
                  name="email" 
                  type="email"
                  placeholder="you@example.com" 
                  required 
                  className="field-focus focus-ring h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors duration-200"
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
                  className="field-focus focus-ring h-10 sm:h-11"
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <SubmitButton 
                pendingText="Signing in..." 
                formAction={signInAction}
                className="w-full rounded-xl py-3 sm:py-6 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign in
              </SubmitButton>
              
              <FormMessage message={searchParams} />
            </div>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
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
