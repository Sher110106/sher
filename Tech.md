# Quad - Technical Architecture Deep Dive

This document provides an exhaustive technical breakdown of the Quad platform's internal mechanisms, focusing on backend systems, data flows, integrations, and algorithmic processes.

---

## Table of Contents

1. [Core Architecture Overview](#core-architecture-overview)
2. [Authentication & Authorization System](#authentication--authorization-system)
3. [Database Architecture (Supabase)](#database-architecture-supabase)
4. [Teaching Request Lifecycle](#teaching-request-lifecycle)
5. [Google Calendar & Meet Integration](#google-calendar--meet-integration)
6. [Email Notification System](#email-notification-system)
7. [Real-Time Subscription System](#real-time-subscription-system)
8. [Automated Teacher Matching Algorithm](#automated-teacher-matching-algorithm)
9. [Teacher Search & Filtering Engine](#teacher-search--filtering-engine)
10. [Session & Token Management](#session--token-management)
11. [Webhook Processing Pipeline](#webhook-processing-pipeline)
12. [Request Timeout & Fallback Mechanism](#request-timeout--fallback-mechanism)

---

## Core Architecture Overview

Quad is built on a **Next.js 14 App Router** architecture with server-side rendering capabilities. The system follows a hybrid approach combining:

- **Server Components**: For initial data fetching and SEO-optimized rendering
- **Server Actions**: For form submissions and mutations (`app/actions.ts`)
- **API Routes**: For RESTful endpoints and webhook handlers (`app/api/`)
- **Client Components**: For interactive features requiring real-time updates

### Request Flow Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser       │────▶│   Middleware     │────▶│  Next.js        │
│   Request       │     │ (Session Check)  │     │  Route Handler  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                        ┌──────────────────┐              │
                        │   Supabase       │◀─────────────┘
                        │   (PostgreSQL)   │
                        └──────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Google APIs    │   │  Resend Email   │   │  Real-time      │
│  (Calendar/Meet)│   │  Service        │   │  Subscriptions  │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Authentication & Authorization System

### Dual Authentication Flow

The system implements role-based authentication with two distinct user types: **Teacher** and **School**.

#### Sign-Up Process (`app/actions.ts:signUpAction`)

```
1. Form Data Extraction
   ├── Common: email, password, role
   ├── School-specific: schoolName, state, district, cluster, block
   └── Teacher-specific: fullName, subjects[], qualifications[], experienceYears, teachingGrade

2. Validation Layer
   ├── Email format validation (handled by Supabase)
   ├── Role validation (must be 'teacher' or 'school')
   └── Role-specific field completeness check

3. Supabase Auth Creation
   └── supabase.auth.signUp({
         email, password,
         options: {
           emailRedirectTo: `${origin}/sign-in`,
           data: { full_name, role }  // Stored in user_metadata
         }
       })

4. Profile Creation Pipeline
   ├── Create base profile in 'profiles' table (id, full_name, role, timestamps)
   └── Create role-specific profile:
       ├── Teacher → 'teacher_profiles' table
       └── School → 'school_profiles' table

5. Error Recovery
   └── If profile creation fails → Delete auth user (rollback)
```

#### Sign-In & Session Management

```typescript
// Sign-in flow (app/actions.ts:signInAction)
1. Authenticate with email/password
2. Extract user metadata to determine role
3. Redirect based on role:
   - 'teacher' → /protected/teacher/dashboard
   - 'school' → /protected/school/dashboard
```

### Middleware Session Validation (`middleware.ts` + `utils/supabase/middleware.ts`)

The middleware runs on every request (except static assets) and performs:

```typescript
1. Extract cookies from request
2. Create Supabase SSR client with cookie handler
3. Call supabase.auth.getUser() to refresh session if expired
4. Route Protection Logic:
   ├── If path starts with '/protected' AND user.error → Redirect to /sign-in
   └── If path is '/' AND no user.error → Redirect to /protected
5. Set updated session cookies in response
```

**Matched Routes** (from config.matcher):
```
"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
```

---

## Database Architecture (Supabase)

### Core Tables Schema

```sql
-- User identity and base profile
profiles
├── id: UUID (FK → auth.users.id)
├── full_name: VARCHAR
├── role: ENUM('teacher', 'school')
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

-- School-specific data
school_profiles
├── id: UUID (FK → profiles.id)
├── school_name: VARCHAR
├── state: VARCHAR
├── district: VARCHAR
├── cluster: VARCHAR
├── block: VARCHAR
└── email: VARCHAR

-- Teacher-specific data
teacher_profiles
├── id: UUID (FK → profiles.id)
├── full_name: VARCHAR
├── email: VARCHAR
├── subjects: TEXT[]
├── qualifications: TEXT[]
├── experience_years: INTEGER
├── teaching_grade: INTEGER
├── avg_rating: DECIMAL
└── availability: JSONB
    └── Structure: {
          schedule: [
            { day: "Monday", time_range: { start: "09:00", end: "10:00" } },
            ...
          ]
        }

-- Teaching request tracking
teaching_requests
├── id: UUID
├── school_id: UUID (FK → school_profiles.id)
├── teacher_id: UUID (FK → teacher_profiles.id)
├── subject: VARCHAR
├── schedule: JSONB { date: "YYYY-MM-DD", time: "HH:MM AM/PM" }
├── status: ENUM('pending', 'accepted', 'rejected', 'timeout', 'failed')
├── timeout_at: TIMESTAMP (for automated requests)
├── fallback_teachers: UUID[] (for automated requests)
└── created_at: TIMESTAMP

-- Google Meet session details
meeting_details
├── id: UUID
├── teaching_request_id: UUID (FK → teaching_requests.id)
├── teacher_id: UUID (FK → teacher_profiles.id)
├── meet_link: VARCHAR
├── meet_id: VARCHAR
├── summary: TEXT
├── description: TEXT
├── recording_link: VARCHAR (nullable, manually added)
└── created_at: TIMESTAMP

-- OAuth token storage
user_google_tokens
├── user_id: UUID (FK → teacher_profiles.id)
├── access_token: TEXT
├── refresh_token: TEXT
└── expiry_date: BIGINT (Unix timestamp)
```

### Supabase Client Architecture

The application uses **two distinct Supabase clients**:

#### 1. Server Client (`utils/supabase/server.ts`)
```typescript
// Used in: Server Components, API Routes, Server Actions
export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
};
```

#### 2. Browser Client (`utils/supabase/client.ts`)
```typescript
// Used in: Client Components requiring real-time subscriptions
import { createBrowserClient } from "@supabase/ssr";
export const createClient = () => createBrowserClient(URL, ANON_KEY);
```

---

## Teaching Request Lifecycle

The teaching request flows through multiple states with associated side effects:

### State Machine

```
                    ┌─────────────┐
                    │   CREATED   │
                    │  (pending)  │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌─────────────────┐       ┌─────────────────┐
    │    ACCEPTED     │       │    REJECTED     │
    │                 │       │                 │
    └────────┬────────┘       └─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │  MEETING CREATED│
    │ (Google Meet)   │
    └─────────────────┘

For Automated Requests:
    ┌─────────────────┐
    │    TIMEOUT      │──▶ Try next fallback teacher
    └─────────────────┘
             │
             ▼ (no more fallbacks)
    ┌─────────────────┐
    │     FAILED      │
    └─────────────────┘
```

### Request Creation Flow (`app/api/teaching-requests/route.ts`)

```typescript
POST /api/teaching-requests
Body: { teacher_id, subject, schedule: { date, time } }

1. Authenticate request (get user from session)
2. Validate required fields (teacher_id, subject, schedule)
3. Insert into teaching_requests:
   {
     school_id: user.id,  // Authenticated school
     teacher_id,
     subject,
     schedule,
     status: 'pending'
   }
4. Return created request data
```

### Status Update Trigger (Client-Side)

```typescript
// TeachingRequestsProvider.tsx:handleStatusUpdate
1. Update teaching_requests table SET status = newStatus
2. This triggers Supabase Database Webhook
3. Webhook calls /api/webhooks/teaching-requests
```

---

## Google Calendar & Meet Integration

### OAuth 2.0 Authorization Flow

The system implements the **Authorization Code Flow with Offline Access** for Google APIs:

#### Phase 1: Authorization Request (`app/api/auth/google/route.ts`)

```typescript
GET /api/auth/google?teacherId={id}&requestId={id}

1. Encode state parameter:
   state = Base64(JSON.stringify({ teacherId, requestId }))

2. Generate OAuth URL with scopes:
   - https://www.googleapis.com/auth/calendar
   - https://www.googleapis.com/auth/calendar.events

3. Set state in HttpOnly cookie for CSRF protection

4. Redirect to Google's authorization endpoint:
   oauth2Client.generateAuthUrl({
     access_type: 'offline',  // Get refresh token
     scope: SCOPES,
     state,
     prompt: 'consent'  // Force consent to ensure refresh token
   })
```

#### Phase 2: Callback Handler (`app/api/auth/callback/google/route.ts`)

```typescript
GET /api/auth/callback/google?code={code}&state={state}

1. Validate state against stored cookie (CSRF protection)
2. Clear state cookie
3. Decode state to extract teacherId, requestId
4. Exchange code for tokens:
   const { tokens } = await oauth2Client.getToken(code)
5. Store tokens in user_google_tokens table:
   UPSERT { user_id, access_token, refresh_token, expiry_date }
6. If requestId exists, trigger webhook to process pending request
7. Redirect to teacher dashboard with success status
```

### Token Refresh Mechanism (`utils/google-meet.ts`)

```typescript
// Automatic token refresh with 5-minute buffer
const now = Date.now();
const expiryDate = oauth2Client.credentials.expiry_date;

if (!expiryDate || now >= expiryDate - 5 * 60 * 1000) {
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  // Update database with new tokens
  await supabase.from('user_google_tokens').update({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || existing.refresh_token,
    expiry_date: credentials.expiry_date
  }).eq('user_id', teacherId);
}
```

### Google Meet Creation (`utils/google-meet.ts:createMeetingWithUserAuth`)

```typescript
1. Fetch teacher's stored tokens from database
2. Set credentials on OAuth2 client
3. Refresh if expired (5-min buffer)
4. Create Calendar event with conferenceData:
   {
     summary: "${subject} Class - ${schoolName}",
     description: "Teaching session for ${subject}",
     start: { dateTime: startTime, timeZone: 'UTC' },
     end: { dateTime: endTime, timeZone: 'UTC' },
     conferenceData: {
       createRequest: {
         requestId: `teaching_${timestamp}`,
         conferenceSolutionKey: { type: 'hangoutsMeet' }
       }
     }
   }
5. Insert event with conferenceDataVersion: 1
6. Extract meetingLink from response.conferenceData.entryPoints[0].uri
7. Return { meetingLink, meetingId }

Error Case: NO_GOOGLE_AUTH
- Return { needsAuth: true, authUrl } for OAuth flow initiation
```

---

## Email Notification System

### Architecture: Resend + React Email

The email system uses **Resend** as the delivery service and **React Email** for templating:

```typescript
// Email rendering pipeline
import { Resend } from 'resend';
import { render } from '@react-email/render';
import EmailTemplate from '@/emails/TeachingRequestEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailHTML = await render(EmailTemplate({ ...props }));

await resend.emails.send({
  from: 'noreply@bugzer.xyz',
  to: recipient,
  subject: emailSubject,
  html: emailHTML,
});
```

### Email Template States (`emails/TeachingRequestEmail.tsx`)

| Status | Recipient | Subject | Content |
|--------|-----------|---------|---------|
| `pending` | Teacher | "New Teaching Request" | Request details, review prompt |
| `accepted` | Both | "Teaching Request Accepted - Meeting Details" | Schedule, Google Meet link |
| `rejected` | School | "Teaching Request Declined" | Rejection notice, next steps |
| `needs_auth` | Teacher | "Google Calendar Authorization Required" | Auth link, explanation |

### Trigger Points

```typescript
// All triggered from webhook handler: app/api/webhooks/teaching-requests/route.ts

switch (record.status) {
  case 'pending':
    await sendPendingEmail(teacherData, schoolData, record);
    break;
  case 'accepted':
    await handleAcceptedRequest(teacherData, schoolData, record, supabase);
    // ↳ Internally calls sendAcceptanceEmails() after meeting creation
    // ↳ Or sendAuthorizationEmail() if OAuth needed
    break;
  case 'rejected':
    await sendRejectionEmail(teacherData, schoolData, record);
    break;
}
```

---

## Real-Time Subscription System

### Supabase Realtime Channels

The application uses Supabase's PostgreSQL Change Data Capture (CDC) for real-time updates:

#### Teaching Requests Subscription (`components/TeachingRequestsProvider.tsx`)

```typescript
const channel = supabase
  .channel('teaching_requests')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'teaching_requests',
    },
    async (payload) => {
      if (payload.new.teacher_id !== userId) return;
      
      // Fetch complete request with school relation
      const { data: newRequest } = await supabase
        .from('teaching_requests')
        .select(`*, school:school_profiles(...)`)
        .eq('id', payload.new.id)
        .single();
      
      setAllRequests(prev => [newRequest, ...prev]);
    }
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'teaching_requests' },
    (payload) => {
      if (payload.new.teacher_id !== userId) return;
      setAllRequests(prev =>
        prev.map(req => req.id === payload.new.id ? { ...req, ...payload.new } : req)
      );
    }
  )
  .subscribe();
```

#### Automated Requests Subscription (`app/protected/school/automated-requests/page.tsx`)

```typescript
// User-scoped channel with retry logic
const channelName = `automated-requests-${user.id}`;

const subscription = supabase
  .channel(channelName)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'teaching_requests',
    filter: `school_id=eq.${user.id}`  // Only this school's requests
  }, (payload) => {
    fetchRequests();  // Refetch all data on any change
  })
  .subscribe((status) => {
    switch (status) {
      case 'SUBSCRIBED': // Success
      case 'CHANNEL_ERROR': // Retry with exponential backoff
      case 'TIMED_OUT': // Reconnect
      case 'CLOSED': // Cleanup
    }
  });
```

### Retry Logic for Failed Subscriptions

```typescript
if (status === 'CHANNEL_ERROR') {
  if (retryCount < maxRetries) {
    retryCount++;
    const retryDelay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
    setTimeout(() => {
      subscription.unsubscribe();
      setupSubscription();
    }, retryDelay);
  } else {
    // Show user notification about manual refresh needed
  }
}
```

---

## Automated Teacher Matching Algorithm

### Request Creation (`app/api/automated-requests/route.ts`)

```typescript
POST /api/automated-requests
Body: { subject, schedule: {date, time}, grade_level, minimum_rating? }

Algorithm:
1. Query qualified teachers:
   SELECT id, avg_rating FROM teacher_profiles
   WHERE subjects @> [subject]           -- Contains subject
     AND teaching_grade >= grade_level   -- Meets grade requirement
   ORDER BY avg_rating DESC              -- Best rated first
   LIMIT 5                               -- Top 5 candidates

2. If no teachers match → Return 404

3. Create request with fallback chain:
   INSERT INTO teaching_requests {
     school_id: user.id,
     teacher_id: teachers[0].id,         -- Primary choice
     subject,
     schedule,
     status: 'pending',
     timeout_at: NOW() + 7200 seconds,   -- 2 hour deadline
     fallback_teachers: teachers.slice(1).map(t => t.id)  -- Backup queue
   }

4. Return created request
```

### Timeout Processing (`app/api/check-timeouts/route.ts`)

This endpoint should be called periodically (e.g., via cron job):

```typescript
GET /api/check-timeouts

1. Find expired pending requests:
   SELECT * FROM teaching_requests
   WHERE timeout_at <= NOW() AND status = 'pending'

2. For each expired request:
   a. If fallback_teachers is empty:
      UPDATE SET status = 'failed'
   
   b. If fallbacks exist:
      const [nextTeacher, ...remaining] = fallback_teachers
      UPDATE SET {
        teacher_id: nextTeacher,
        fallback_teachers: remaining,
        timeout_at: NOW() + 7200 seconds  // Reset 2-hour timer
      }

3. Return { processed: count }
```

### Fallback Chain Visualization

```
Initial State:
  teacher_id: A
  fallback_teachers: [B, C, D]
  timeout_at: T+2h

After A times out (no response):
  teacher_id: B
  fallback_teachers: [C, D]
  timeout_at: T+4h

After B times out:
  teacher_id: C
  fallback_teachers: [D]
  timeout_at: T+6h

After C times out:
  teacher_id: D
  fallback_teachers: []
  timeout_at: T+8h

After D times out:
  status: 'failed'
```

---

## Teacher Search & Filtering Engine

### Query Building (`app/api/teachers/search/route.ts`)

```typescript
GET /api/teachers/search?subject=math&minExperience=5&...

Query Construction Pipeline:

1. Base Query:
   SELECT id, full_name, subjects, qualifications,
          experience_years, teaching_grade, availability
   FROM teacher_profiles
   ORDER BY experience_years DESC
   LIMIT 20

2. Subject Filter (PostgreSQL Array Operators):
   // Case-insensitive matching via multiple containment checks
   .or(`
     subjects.cs.{["Math"]},
     subjects.cs.{["math"]},
     subjects.cs.{["MATH"]}
   `)

3. Experience Range Filter:
   .gte('experience_years', minExperience)
   .lte('experience_years', maxExperience)

4. Qualifications Filter (Array Overlap):
   .overlaps('qualifications', ['B.Ed', 'M.Ed'])

5. Grade Level Filter:
   .eq('teaching_grade', gradeLevel)

6. Availability Filter (JSONB Query):
   .filter('availability->schedule', 'cs', 
     JSON.stringify([{ day: 'Monday' }]))
   
   // With specific time:
   .filter('availability->schedule', 'cs',
     JSON.stringify([{ time_range: { start: '09:00' } }]))
```

### Post-Query Filtering (Client-Side Refinement)

```typescript
// Due to Supabase limitations with case-insensitive array matching
let filteredData = data;

// Case-insensitive subject filter (final check)
if (subject) {
  filteredData = filteredData.filter(teacher =>
    Array.isArray(teacher.subjects) &&
    teacher.subjects.some(s => s.toLowerCase() === subject.toLowerCase())
  );
}

// Precise availability matching
if (availability?.day && availability?.startTime) {
  filteredData = filteredData.filter(teacher =>
    teacher.availability?.schedule?.some(slot =>
      slot.day === availability.day &&
      slot.time_range.start === availability.startTime
    )
  );
}
```

### Sorting Modes (Client-Side)

```typescript
switch (filters.sortBy) {
  case 'experience_desc':
    teachers.sort((a, b) => b.experience_years - a.experience_years);
    break;
  case 'experience_asc':
    teachers.sort((a, b) => a.experience_years - b.experience_years);
    break;
  case 'name_asc':
    teachers.sort((a, b) => a.full_name.localeCompare(b.full_name));
    break;
  case 'name_desc':
    teachers.sort((a, b) => b.full_name.localeCompare(a.full_name));
    break;
}
```

---

## Session & Token Management

### Supabase Session Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Storage                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Cookies (HttpOnly, Secure, SameSite=Lax)            │    │
│  │  - sb-{ref}-auth-token (Access Token)               │    │
│  │  - sb-{ref}-auth-token-code-verifier (PKCE)         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

Session Refresh Flow:
1. Middleware intercepts request
2. Calls supabase.auth.getUser()
3. If access token expired, Supabase SDK:
   - Uses refresh token to get new access token
   - Updates cookies automatically
4. Updated cookies sent with response
```

### Google OAuth Token Storage

```
Database: user_google_tokens
├── access_token: Short-lived (~1 hour)
├── refresh_token: Long-lived (until revoked)
└── expiry_date: Unix timestamp

Refresh Strategy:
- Check expiry before each Calendar API call
- 5-minute buffer before actual expiration
- Use refresh_token to obtain new access_token
- Update database with new tokens
- Preserve original refresh_token if new one not provided
```

---

## Webhook Processing Pipeline

### Webhook Handler (`app/api/webhooks/teaching-requests/route.ts`)

```
Incoming Payload Structure:
{
  type: 'INSERT' | 'UPDATE' | 'DELETE',
  table: 'teaching_requests',
  schema: 'public',
  record: { ...teaching_request_data }
}

Processing Pipeline:

1. Validate Payload
   └── Check type and record exist

2. Fetch Related Data
   ├── Teacher: SELECT full_name, email FROM teacher_profiles
   └── School: SELECT school_name, email FROM school_profiles

3. Status-Based Processing
   └── switch (record.status):
       
   case 'pending':
       └── sendPendingEmail(teacher) → Notify teacher of new request
   
   case 'accepted':
       └── handleAcceptedRequest():
           ├── Check for existing meeting (idempotency)
           ├── Parse schedule to DateTime
           ├── Create Google Meet via Calendar API
           ├── Insert meeting_details record
           └── sendAcceptanceEmails(teacher, school)
   
   case 'rejected':
       └── sendRejectionEmail(school) → Notify school of decline

4. Error Handling
   └── Any error → Return 500 with "Internal error"
```

### Time Parsing Logic

```typescript
// Schedule format: { date: "2024-03-15", time: "02:30 PM" }

const [year, month, day] = schedule.date.split('-');
const timeMatch = schedule.time.match(/(\d+):(\d+)\s*(AM|PM)/i);

let hours = parseInt(timeMatch[1]);
const minutes = parseInt(timeMatch[2]);
const period = timeMatch[3].toUpperCase();

// 12-hour to 24-hour conversion
if (period === 'PM' && hours !== 12) hours += 12;
if (period === 'AM' && hours === 12) hours = 0;

const startTime = new Date(year, month - 1, day, hours, minutes);
const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour
```

---

## Request Timeout & Fallback Mechanism

### Timeout Architecture

```
┌─────────────────┐
│  Automated      │
│  Request        │
│  Created        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Timer Starts   │
│  (2 hours)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌───────────────┐
│Accept │  │ Timeout       │
│       │  │ (No Response) │
└───────┘  └───────┬───────┘
                   │
           ┌───────┴───────┐
           │               │
           ▼               ▼
    ┌────────────┐  ┌────────────┐
    │ Fallback   │  │ No More    │
    │ Available  │  │ Fallbacks  │
    └──────┬─────┘  └──────┬─────┘
           │               │
           ▼               ▼
    ┌────────────┐  ┌────────────┐
    │ Assign     │  │ Mark as    │
    │ Next       │  │ FAILED     │
    │ Teacher    │  └────────────┘
    └────────────┘
           │
           ▼
    ┌────────────┐
    │ New Timer  │
    │ (2 hours)  │
    └────────────┘
```

### Database Update Pattern

```typescript
// Atomic fallback transition
const [nextTeacher, ...remaining] = request.fallback_teachers;

await supabase
  .from('teaching_requests')
  .update({
    teacher_id: nextTeacher,
    fallback_teachers: remaining,
    timeout_at: new Date(Date.now() + 7200 * 1000).toISOString()
  })
  .eq('id', request.id);
```

---

## Environment Variables Reference

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (Admin operations only)

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Application
NEXT_PUBLIC_BASE_URL=https://sher-sable.vercel.app

# Email Service
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@bugzer.xyz
```

---

## Security Considerations

1. **Row Level Security (RLS)**: Supabase policies should restrict data access per user role
2. **CSRF Protection**: OAuth state parameter stored in HttpOnly cookies
3. **Token Storage**: Google tokens stored server-side in database, never exposed to client
4. **Session Validation**: Every protected route validates session via middleware
5. **Input Validation**: Server actions and API routes validate all inputs before processing
6. **Webhook Authentication**: Consider adding signature verification for production webhooks
