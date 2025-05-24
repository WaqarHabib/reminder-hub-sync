
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface SMSData {
  to: string;
  body: string;
}

const sendEmail = async (emailData: EmailData) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Reminder Scheduler <reminders@yourdomain.com>',
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return await response.json();
};

const sendSMS = async (smsData: SMSData) => {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: smsData.to,
        Body: smsData.body,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send SMS: ${error}`);
  }

  return await response.json();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Checking for reminders on ${today}`);

    // Fetch reminders that are due today and haven't been sent
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('reminder_date', today)
      .eq('is_sent', false);

    if (error) {
      throw error;
    }

    console.log(`Found ${reminders?.length || 0} reminders to send`);

    const results = [];

    for (const reminder of reminders || []) {
      try {
        console.log(`Processing reminder ${reminder.id} for ${reminder.email}`);

        // Send email
        const emailData: EmailData = {
          to: reminder.email,
          subject: 'Reminder Notification',
          text: `Hello ${reminder.full_name},\n\nThis is your scheduled reminder:\n\n${reminder.custom_message}\n\nBest regards,\nReminder Scheduler`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Reminder Notification</h2>
              <p>Hello <strong>${reminder.full_name}</strong>,</p>
              <p>This is your scheduled reminder:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">${reminder.custom_message}</p>
              </div>
              <p>Best regards,<br>Reminder Scheduler</p>
            </div>
          `,
        };

        await sendEmail(emailData);
        console.log(`Email sent successfully for reminder ${reminder.id}`);

        // Send SMS
        const smsData: SMSData = {
          to: reminder.phone_number,
          body: `Reminder for ${reminder.full_name}: ${reminder.custom_message}`,
        };

        await sendSMS(smsData);
        console.log(`SMS sent successfully for reminder ${reminder.id}`);

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('reminders')
          .update({ is_sent: true })
          .eq('id', reminder.id);

        if (updateError) {
          throw updateError;
        }

        results.push({
          id: reminder.id,
          email: reminder.email,
          phone: reminder.phone_number,
          status: 'success',
        });

        console.log(`Reminder ${reminder.id} marked as sent`);

      } catch (error) {
        console.error(`Failed to process reminder ${reminder.id}:`, error);
        results.push({
          id: reminder.id,
          email: reminder.email,
          phone: reminder.phone_number,
          status: 'error',
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-reminders function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
