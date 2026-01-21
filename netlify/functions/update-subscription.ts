/**
 * Netlify Function: Update Subscription
 * 
 * Handles subscription updates securely using the Supabase SERVICE_ROLE_KEY.
 * This bypasses RLS to allow subscription modifications after payment verification.
 * 
 * IMPORTANT: Never expose SERVICE_ROLE_KEY in frontend code!
 * 
 * Usage:
 * POST /.netlify/functions/update-subscription
 * Body: { userId, plan, paymentReference, paymentProvider }
 * 
 * For Paystack integration:
 * 1. Verify payment via Paystack API
 * 2. Call this function to update subscription
 */

import { createClient } from '@supabase/supabase-js';
import type { Handler, HandlerEvent } from '@netlify/functions';

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

interface SubscriptionUpdateRequest {
  userId: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  paymentReference?: string;
  paymentProvider?: string;
  expiresAt?: string;
}

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Verify authentication
  const authHeader = event.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the user's token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    // Parse request body
    const body: SubscriptionUpdateRequest = JSON.parse(event.body || '{}');

    // Verify the user is updating their own subscription
    // (Admin override would need additional role checking)
    if (body.userId !== user.id) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Cannot update another user\'s subscription' }),
      };
    }

    // TODO: Add Paystack/Stripe payment verification here
    // Example for Paystack:
    // const verified = await verifyPaystackPayment(body.paymentReference);
    // if (!verified) {
    //   return { statusCode: 400, body: JSON.stringify({ error: 'Payment verification failed' }) };
    // }

    // Calculate expiry based on plan
    let expiresAt: string | null = null;
    if (body.plan !== 'free') {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1); // 1 month subscription
      expiresAt = expiry.toISOString();
    }

    // Update subscription using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: body.plan,
        status: 'active',
        payment_provider: body.paymentProvider || null,
        payment_reference: body.paymentReference || null,
        expires_at: body.expiresAt || expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', body.userId)
      .select()
      .single();

    if (error) {
      console.error('Subscription update error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update subscription' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        subscription: data,
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
