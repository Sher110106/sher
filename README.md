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
   ```

4. **Development**
   ```bash
   npm run dev
   ```

## Project Structure
app/
├── (auth-pages)/ # Authentication related pages
├── api/ # API routes
├── protected/ # Protected routes
│ ├── school/ # School dashboard and features
│ └── teacher/ # Teacher dashboard and features
├── components/ # Reusable UI components
└── utils/ # Utility functions and helpers

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