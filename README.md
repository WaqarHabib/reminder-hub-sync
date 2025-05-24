
# Reminder Scheduler App

A full-stack web application for scheduling and managing reminders with automated email and SMS notifications.

## Features

- **User Authentication**: Secure login and registration system
- **Reminder Management**: Create, edit, and delete reminders
- **Automated Notifications**: Email and SMS reminders sent on scheduled dates
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Updates**: Instant feedback and data synchronization

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Edge Functions)
- **Notifications**: Resend (Email), Twilio (SMS)
- **Deployment**: Supabase Edge Functions for serverless backend

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Resend account (for email)
- Twilio account (for SMS)

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Edge Functions (configured in Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Supabase database (tables and RLS policies are included)
4. Configure environment variables in Supabase dashboard
5. Deploy the edge function for sending reminders
6. Start the development server:
   ```bash
   npm run dev
   ```

### Database Schema

The app uses two main tables:

- `profiles`: User profile information
- `reminders`: Reminder data with user associations

Row Level Security (RLS) is enabled to ensure users can only access their own data.

### Edge Function

The `send-reminders` edge function runs daily to:
1. Check for reminders due today
2. Send email notifications via Resend
3. Send SMS notifications via Twilio
4. Mark reminders as sent

### Scheduling Reminders

To automate the daily reminder checks, set up a cron job or use Supabase's pg_cron extension:

```sql
SELECT cron.schedule(
  'send-daily-reminders',
  '0 9 * * *', -- Run at 9 AM daily
  $$SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer your-anon-key"}'
  )$$
);
```

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Main dashboard
│   ├── layout/         # Layout components
│   ├── reminders/      # Reminder management
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── integrations/      # Supabase client
└── pages/            # Page components

supabase/
└── functions/
    └── send-reminders/ # Edge function for notifications
```

## API Endpoints

- `POST /functions/v1/send-reminders` - Processes and sends due reminders

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
