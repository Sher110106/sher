import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { SmtpMessage } from "../smtp-message";
import { ArrowLeft, Mail } from "lucide-react";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 -z-10" />
      
      <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
        <Card className="animate-fade-in">
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
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">Reset your password</CardTitle>
              <p className="text-sm sm:text-base text-muted-foreground">
                Enter your email address and we'll send you a reset link
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      name="email" 
                      type="email"
                      placeholder="you@example.com" 
                      required 
                      className="field-focus focus-ring pl-10 h-10 sm:h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <SubmitButton 
                  formAction={forgotPasswordAction}
                  className="w-full rounded-xl py-3 sm:py-6 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Send reset link
                </SubmitButton>
                
                <FormMessage message={searchParams} />
              </div>
            </form>

            <div className="mt-6 sm:mt-8 text-center">
              <Link 
                href="/sign-in"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                Back to sign in
              </Link>
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
