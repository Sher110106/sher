import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingWizard from '@/components/OnboardingWizard';

export default async function TeacherOnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Check if already completed onboarding
  const { data: teacherProfile } = await supabase
    .from('teacher_profiles')
    .select('id, full_name, subjects, qualifications, experience_years, availability, onboarding_completed')
    .eq('id', user.id)
    .single();

  // If onboarding is already completed, redirect to dashboard
  if (teacherProfile?.onboarding_completed) {
    redirect('/protected/teacher/dashboard');
  }

  // Check Google connection status
  const { data: googleTokens } = await supabase
    .from('user_google_tokens')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <OnboardingWizard 
        userId={user.id}
        initialProfile={teacherProfile}
        isGoogleConnected={!!googleTokens}
      />
    </div>
  );
}
