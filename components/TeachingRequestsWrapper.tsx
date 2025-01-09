'use client';

import { createClient } from '@/utils/supabase/client';
import TeachingRequestsList from './TeachingRequestsProvider';

interface WrapperProps {
  initialRequests: any[];
  userId: string;
}

export default function TeachingRequestsWrapper({ initialRequests, userId }: WrapperProps) {
  const supabase = createClient();

  return (
    <TeachingRequestsList
      initialRequests={initialRequests}
      supabase={supabase}
      userId={userId}
    />
  );
} 