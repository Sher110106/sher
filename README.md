# Quad - Educational Platform

Quad is a modern web platform that connects teachers with schools, facilitating online teaching and class management. Built with Next.js 14, Supabase, and TypeScript.

## Features

### For Teachers
- **Profile Management**
  - Personal information
  - Subject expertise
  - Qualifications
  - Teaching experience
  - Availability scheduling

- **Class Management**
  - View upcoming and past classes
  - Integrated Google Meet for online teaching
  - Class recordings management

### For Schools
- **Teacher Discovery**
  - Advanced search with filters
  - View teacher profiles and availability
  - Subject-based matching
  - Experience level filtering

- **Class Administration**
  - Schedule management
  - Past classes tracking
  - Recording links management
  - Direct communication with teachers

### Core Features
- **Authentication & Authorization**
  - Role-based access control
  - Secure email authentication
  - Protected routes

- **Real-time Updates**
  - Live class status
  - Instant notifications
  - Automatic calendar sync

## Tech Stack

- **Frontend**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - shadcn/ui Components

- **Backend**
  - Supabase (Database & Authentication)
  - Google Calendar API
  - Vercel (Hosting)

## Getting Started

1. **Prerequisites**
   ```bash
   Node.js 18+ 
   npm/yarn/pnpm
   ```

2. **Environment Setup**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd quad

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env.local
   ```

3. **Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   RESEND_API_KEY=your_resend_api_key
   GOOGLE_CLIENT_ID=your_google_cliend_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   NEXT_PUBLIC_BASE_URL=your_public_url
   ```

4. **Development**
   ```bash
   npm run dev
   ```

## Project Structure

```
app/
├── (auth-pages)/                # Authentication related pages
│   ├── sign-in/                 # Sign in page and components
│   ├── sign-up/                 # Sign up page with role selection
│   └── confirm/                 # Email confirmation handling
│
├── api/                         # API routes
│   ├── auth/                    # Authentication endpoints
│   │   ├── google/             # Google OAuth handling
│   │   └── callback/           # OAuth callback handling
│   ├── school/                 # School-related endpoints
│   │   └── update/            # School profile updates
│   ├── teachers/              # Teacher-related endpoints
│   │   ├── search/           # Teacher search functionality
│   │   └── update/           # Teacher profile updates
│   └── webhooks/             # Webhook handlers
│       └── teaching-requests # Teaching request management
│
├── protected/                  # Protected routes (authenticated users only)
│   ├── school/               # School-specific pages
│   │   ├── dashboard/       # School dashboard
│   │   ├── teachers/        # Teacher search and management
│   │   ├── past_classes/    # Past classes management
│   │   └── edit/           # School profile editing
│   │
│   └── teacher/            # Teacher-specific pages
│       ├── dashboard/      # Teacher dashboard
│       ├── schedule/       # Availability management
│       ├── past_classes/   # Class history and recordings
│       └── edit/          # Teacher profile editing
│
├── components/             # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── forms/           # Form-related components
│   └── layout/          # Layout components
│
└── utils/               # Utility functions and helpers
    ├── supabase/       # Supabase client configuration
    │   ├── client.ts   # Client-side Supabase instance
    │   └── server.ts   # Server-side Supabase instance
    ├── google-auth.ts  # Google OAuth configuration
    ├── google-meet.ts  # Google Meet integration
    └── types/         # TypeScript type definitions




### Key Directories and Files

#### Authentication (`app/(auth-pages)/`)
- Handles user authentication flow
- Implements role-based signup (teacher/school)
- Manages email confirmation and OAuth

#### API Routes (`app/api/`)
- RESTful endpoints for data operations
- Webhook handlers for real-time updates
- Authentication callback handlers

#### Protected Routes (`app/protected/`)
- Role-specific dashboards and features
- Profile management interfaces
- Class scheduling and management

#### Components (`components/`)
- Reusable UI components built with shadcn/ui
- Form components with validation
- Layout components for consistent UI

#### Utilities (`utils/`)
- Database client configuration
- Third-party service integrations
- TypeScript interfaces and types

### Database Schema

```sql
tables/
├── school_profiles        # School information
├── teacher_profiles      # Teacher information
├── teaching_requests    # Class scheduling requests
├── meeting_details     # Online class details
├── user_google_tokens # OAuth tokens
└── availability      # Teacher availability slots
```

### Key Features by Directory

#### School Features (`app/protected/school/`)
- Teacher search and filtering
- Class scheduling
- Past class management
- Recording management

#### Teacher Features (`app/protected/teacher/`)
- Availability management
- Class schedule viewing
- Profile management
- Past class access

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Powered by Bharti Airtel Foundation
- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)