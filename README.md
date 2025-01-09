# Quad - Educational Platform
https://sher-sable.vercel.app
Quad is a modern web platform that connects teachers with schools, facilitating online teaching and class management. Built with Next.js 14, Supabase, and TypeScript.

# User Flow Guide

## Deployment Note

### Testing the Application
The application is currently hosted at: https://sher-sable.vercel.app
You should read this project on github 
Github Repo Link : https://github.com/Sher110106/sher/tree/main
and Please watch this tutorial on how the app functions : https://youtu.be/BQWEys91EJA
Please make sure to make a file named .env.local and fill in the values from the env.txt file and also run npm install. 


**Important**: Please test the application on the hosted version only, as all API redirect URLs and configurations are set specifically for this deployment.

### Test Credentials
For testing purposes, you can use the following credentials and directly log in to the application:

**School Account:**
- Email: scraperid5@gmail.com
- Password: 1234567

**Teacher Account:**
- Email: sherpartap1101@gmail.com
- Password: 123456

### Google OAuth Testing
Currently, Google OAuth is in testing mode pending verification (estimated 3-4 weeks). During this period, you can use the following test account for Google OAuth integration:
So use any email id to register for either teacher or school
but when you are accepting the request for first time in teacher dashboard then you would be required to use a google oauth and currently this app is in testing mode due to which only the liseted ids can be used so then just login with this gmail and then you can do that google oauth. But Please register with your own account.
- Email: bugzerrr@gmail.com
- Password: Quad1234$

### Technical Implementation Notes
- Email notifications are handled through Resend email service
- Base URLs in Supabase and Google Cloud Console are configured for the hosted version
- Registration and sign-up features are only available on the hosted version



## Registration and Authentication Process
1. Initial Sign Up
   - Choose your role (School or Teacher)
   - Fill in required profile information
   - Submit registration form
   - Click confirmation link sent to your email
   - Account is activated upon confirmation

2. Sign In
   - Common sign-in page for all users
   - Users are automatically redirected to their role-specific dashboard

## Teacher Flow

### Dashboard Features
1. Request Management
   - View incoming teaching requests
   - Accept or reject requests
   - First-time acceptance requires Google OAuth authorization
   - Upon authorization, calendar access is granted for automatic scheduling

### Profile Management
1. Availability Settings
   - Access schedule management via dashboard
   - Set available time slots
   - Update recurring availability
   - Changes reflect immediately in school search results

2. Profile Editing
   - Update personal information
   - Modify teaching subjects
   - Update qualifications
   - Add/edit teaching experience

### Class Management
1. Upcoming Classes
   - View scheduled classes
   - Access Google Meet links
   - Track class status

2. Past Classes
   - View complete teaching history
   - Add/update recording links
   - Access class details and notes

## School Flow

### Teacher Discovery
1. Search Interface
   - Access teacher search page
   - Apply multiple filters:
     - Subject expertise
     - Availability
     - Experience level
     - Rating
   - Sort results by various parameters
   - View detailed teacher profiles

2. Booking Process
   - Select desired teacher
   - Choose available time slot
   - Specify subject and class details
   - Submit teaching request
   - Receive confirmation email

### Management Features
1. Profile Management
   - Edit school information
   - Update contact details
   - Modify school preferences

2. Class Tracking
   - View upcoming classes
   - Access past class records
   - Manage recording links
   - Track teacher interactions

## Recording Implementation Note

### Current Implementation
- Manual recording link updates available for both teachers and schools
- Recording links can be added post-class to the past classes section

### Automatic Recording Limitations
Due to technical requirements, automatic recording features could not be implemented. This would require:
- Google Workspace Enterprise account for Google Meet automatic recordings
- Zoom Pro account for Zoom automatic recordings

These features may be implemented in future versions when enterprise accounts are available.

## Email Notifications
- Both teachers and schools receive email notifications for:
  - New teaching requests
  - Request acceptances/rejections
  - Class schedule confirmations
 

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
- Emails by [Resend](https://resend.com/)