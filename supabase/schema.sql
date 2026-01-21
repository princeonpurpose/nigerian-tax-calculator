-- Nigerian Tax Calculator - Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database
-- https://supabase.com/dashboard/project/_/sql

-- =============================================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with additional user data
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  role TEXT DEFAULT 'individual' CHECK (role IN ('individual', 'business', 'admin')),
  tin_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- =============================================================================
-- CALCULATIONS TABLE
-- Stores user tax calculations
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pit', 'cit', 'cgt', 'vat')),
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  notes TEXT,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- Users can perform all CRUD operations on their own calculations
CREATE POLICY "Users can manage own calculations" ON public.calculations
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS calculations_user_id_idx ON public.calculations(user_id);
CREATE INDEX IF NOT EXISTS calculations_type_idx ON public.calculations(type);
CREATE INDEX IF NOT EXISTS calculations_created_at_idx ON public.calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS calculations_is_saved_idx ON public.calculations(is_saved) WHERE is_saved = true;

-- =============================================================================
-- SUBSCRIPTIONS TABLE
-- Manages user subscription plans
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  payment_provider TEXT, -- 'paystack', 'stripe', etc.
  payment_reference TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only backend/admin can update subscriptions (via service role key)
-- This prevents users from upgrading themselves without payment

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- =============================================================================
-- FILING REMINDERS TABLE
-- Stores tax filing reminders with email notification tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.filing_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('pit', 'cit', 'cgt', 'vat')),
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  reminder_7_days_sent BOOLEAN DEFAULT false,
  reminder_1_day_sent BOOLEAN DEFAULT false,
  reminder_due_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.filing_reminders ENABLE ROW LEVEL SECURITY;

-- Users can perform all CRUD operations on their own reminders
CREATE POLICY "Users can manage own reminders" ON public.filing_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS filing_reminders_user_id_idx ON public.filing_reminders(user_id);
CREATE INDEX IF NOT EXISTS filing_reminders_due_date_idx ON public.filing_reminders(due_date);
CREATE INDEX IF NOT EXISTS filing_reminders_active_idx ON public.filing_reminders(is_active) WHERE is_active = true;

-- =============================================================================
-- AUTO-CREATE PROFILE AND SUBSCRIPTION ON SIGNUP
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create free subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- AUTO-UPDATE UPDATED_AT TIMESTAMP
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_filing_reminders_updated_at ON public.filing_reminders;
CREATE TRIGGER update_filing_reminders_updated_at
  BEFORE UPDATE ON public.filing_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
-- Allow authenticated users to access their data
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.calculations TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

-- =============================================================================
-- ENABLE REALTIME (Optional - for live updates)
-- =============================================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.calculations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
