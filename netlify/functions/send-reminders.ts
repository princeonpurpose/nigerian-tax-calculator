/**
 * Netlify Function: Send Filing Reminders
 * 
 * This function should be triggered daily via Netlify Scheduled Functions
 * or a cron job service to check for and send reminder emails.
 * 
 * Schedule: Every day at 8:00 AM (configured in netlify.toml)
 * 
 * It checks for reminders that:
 * - Are active
 * - Are 7 days, 1 day, or 0 days from due date
 * - Haven't already sent that reminder
 */

import { createClient } from '@supabase/supabase-js';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Initialize Supabase with service role key (server-side only!)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface FilingReminder {
  id: string;
  user_id: string;
  tax_type: string;
  title: string;
  due_date: string;
  email: string;
  is_active: boolean;
  reminder_7_days_sent: boolean;
  reminder_1_day_sent: boolean;
  reminder_due_sent: boolean;
}

interface UserProfile {
  display_name: string;
}

/**
 * Calculate days until due date
 */
function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Send email using your preferred email service
 * Replace this with your actual email provider (SendGrid, Resend, etc.)
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Example using SendGrid (uncomment and add SENDGRID_API_KEY to env):
  /*
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@ngtaxcalc.com', name: 'Nigerian Tax Calculator' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  return response.ok;
  */

  // For now, just log the email (replace with actual implementation)
  console.log('📧 Would send email:', { to, subject });
  console.log('Email HTML:', html);
  
  // Simulate successful send
  return true;
}

/**
 * Generate reminder email HTML
 */
function generateEmailHTML(
  userName: string,
  taxType: string,
  title: string,
  dueDate: string,
  daysUntil: number
): string {
  const taxLabels: Record<string, string> = {
    pit: 'Personal Income Tax (PIT)',
    cit: 'Corporate Income Tax (CIT)',
    cgt: 'Capital Gains Tax (CGT)',
    vat: 'Value Added Tax (VAT)',
  };

  const urgencyMessage = daysUntil === 0 
    ? '⚠️ Your tax filing is DUE TODAY!' 
    : daysUntil === 1 
    ? '⏰ Your tax filing is due TOMORROW!' 
    : `📅 Your tax filing is due in ${daysUntil} days.`;

  const dashboardUrl = process.env.URL || 'https://ngtaxcalc.netlify.app';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🇳🇬 Nigerian Tax Calculator</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Tax Filing Reminder</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
    
    <div style="background: ${daysUntil === 0 ? '#fef2f2' : daysUntil <= 1 ? '#fffbeb' : '#f0fdf4'}; border: 1px solid ${daysUntil === 0 ? '#fecaca' : daysUntil <= 1 ? '#fde68a' : '#bbf7d0'}; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <p style="font-size: 18px; font-weight: bold; color: ${daysUntil === 0 ? '#dc2626' : daysUntil <= 1 ? '#d97706' : '#16a34a'}; margin: 0 0 10px;">
        ${urgencyMessage}
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Filing:</td>
          <td style="padding: 8px 0; font-weight: 500;">${title}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Tax Type:</td>
          <td style="padding: 8px 0; font-weight: 500;">${taxLabels[taxType] || taxType.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
          <td style="padding: 8px 0; font-weight: 500;">${new Date(dueDate).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
      </table>
    </div>

    <p style="margin-bottom: 20px;">Make sure to:</p>
    <ul style="margin-bottom: 20px; padding-left: 20px;">
      <li>Calculate your final tax liability</li>
      <li>Prepare all required documentation</li>
      <li>Submit to the Nigeria Revenue Service (NRS) before the deadline</li>
    </ul>

    <a href="${dashboardUrl}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
      Open Tax Calculator →
    </a>
  </div>

  <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center; font-size: 12px; color: #6b7280;">
    <p style="margin: 0 0 10px;">Nigerian Tax Calculator 2026</p>
    <p style="margin: 0;">Based on Nigeria Tax Act • Effective January 1, 2026</p>
    <p style="margin: 10px 0 0; font-size: 11px;">
      You're receiving this because you set up a filing reminder. 
      <a href="${dashboardUrl}" style="color: #16a34a;">Manage reminders</a>
    </p>
  </div>
</body>
</html>
`;
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  console.log('🚀 Starting reminder check...');
  
  // Verify this is a scheduled event or has proper auth
  // In production, you'd verify the source of the request
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check if Supabase is configured
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server not configured' }),
    };
  }

  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get dates for 7 days and 1 day from now
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Fetch all active reminders
    const { data: reminders, error: fetchError } = await supabaseAdmin
      .from('filing_reminders')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      throw new Error(`Failed to fetch reminders: ${fetchError.message}`);
    }

    console.log(`📋 Found ${reminders?.length || 0} active reminders`);

    const results = {
      processed: 0,
      sent: 0,
      errors: 0,
    };

    // Process each reminder
    for (const reminder of (reminders as FilingReminder[]) || []) {
      results.processed++;
      const daysUntil = getDaysUntilDue(reminder.due_date);
      
      let shouldSend = false;
      let updateField: string | null = null;
      let reminderType = '';

      // Check which reminder to send
      if (daysUntil === 7 && !reminder.reminder_7_days_sent) {
        shouldSend = true;
        updateField = 'reminder_7_days_sent';
        reminderType = '7-day';
      } else if (daysUntil === 1 && !reminder.reminder_1_day_sent) {
        shouldSend = true;
        updateField = 'reminder_1_day_sent';
        reminderType = '1-day';
      } else if (daysUntil === 0 && !reminder.reminder_due_sent) {
        shouldSend = true;
        updateField = 'reminder_due_sent';
        reminderType = 'due-date';
      }

      if (shouldSend && updateField) {
        try {
          // Get user's display name
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('display_name')
            .eq('id', reminder.user_id)
            .single();

          const userName = (profile as UserProfile)?.display_name || 'Tax Filer';

          // Generate and send email
          const subject = daysUntil === 0 
            ? `⚠️ TAX DUE TODAY: ${reminder.title}`
            : daysUntil === 1
            ? `⏰ Tax Due Tomorrow: ${reminder.title}`
            : `📅 Tax Filing Reminder: ${reminder.title} (${daysUntil} days)`;

          const html = generateEmailHTML(
            userName,
            reminder.tax_type,
            reminder.title,
            reminder.due_date,
            daysUntil
          );

          const sent = await sendEmail(reminder.email, subject, html);

          if (sent) {
            // Update reminder to mark as sent
            await supabaseAdmin
              .from('filing_reminders')
              .update({ [updateField]: true, updated_at: new Date().toISOString() })
              .eq('id', reminder.id);

            console.log(`✅ Sent ${reminderType} reminder for "${reminder.title}" to ${reminder.email}`);
            results.sent++;
          } else {
            console.error(`❌ Failed to send email to ${reminder.email}`);
            results.errors++;
          }
        } catch (err) {
          console.error(`❌ Error processing reminder ${reminder.id}:`, err);
          results.errors++;
        }
      }
    }

    console.log(`📊 Results: ${results.sent} sent, ${results.errors} errors, ${results.processed} processed`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        ...results,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('❌ Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
    };
  }
};

export { handler };
