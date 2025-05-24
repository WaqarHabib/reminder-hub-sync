
# Deployment Guide

This guide covers deploying the Reminder Scheduler App to production.

## Supabase Setup

### 1. Database Configuration

The SQL migrations are already included. Make sure your database has:
- `profiles` table with RLS policies
- `reminders` table with RLS policies
- Triggers for user profile creation
- Updated timestamp triggers

### 2. Authentication Settings

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Enable email/password authentication
3. Configure email templates (optional)
4. Set up custom SMTP (recommended for production)

### 3. Edge Function Deployment

The `send-reminders` function is automatically deployed. Configure these secrets:

```bash
# In Supabase Dashboard > Settings > Functions
RESEND_API_KEY=your_resend_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 4. Cron Job Setup

Enable pg_cron extension and create a scheduled job:

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reminder processing at 9 AM
SELECT cron.schedule(
  'send-daily-reminders',
  '0 9 * * *',
  $$SELECT net.http_post(
    url := 'https://your-project-id.supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer your-anon-key", "Content-Type": "application/json"}'
  )$$
);
```

## Frontend Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Deploy

### Netlify

1. Connect your repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables in site settings

### Other Platforms

The app is a standard React application and can be deployed to:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Any static hosting service

## Environment Variables

### Required for Frontend
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Required for Edge Functions (Supabase Secrets)
```env
RESEND_API_KEY=re_your_key
TWILIO_ACCOUNT_SID=AC_your_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Production Checklist

- [ ] Database migrations applied
- [ ] RLS policies configured
- [ ] Authentication enabled
- [ ] Email service configured (Resend)
- [ ] SMS service configured (Twilio)
- [ ] Edge function deployed
- [ ] Cron job scheduled
- [ ] Frontend deployed
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Error monitoring setup (optional)

## Monitoring

### Edge Function Logs

Monitor function execution in Supabase Dashboard > Functions > send-reminders > Logs

### Database Monitoring

Check reminder processing with:

```sql
-- Check recent reminder activity
SELECT 
  DATE(reminder_date) as date,
  COUNT(*) as total_reminders,
  COUNT(*) FILTER (WHERE is_sent = true) as sent_reminders
FROM reminders 
WHERE reminder_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(reminder_date)
ORDER BY date DESC;
```

## Troubleshooting

### Common Issues

1. **Reminders not sending**
   - Check edge function logs
   - Verify API keys are set correctly
   - Ensure cron job is active

2. **Authentication errors**
   - Verify RLS policies
   - Check Supabase URL and keys

3. **Email delivery issues**
   - Verify Resend API key
   - Check sender email domain
   - Review email templates

4. **SMS delivery issues**
   - Verify Twilio credentials
   - Check phone number format
   - Ensure sufficient Twilio balance

For support, check the Supabase documentation or create an issue in the repository.
