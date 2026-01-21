/**
 * Supabase Database Types
 * 
 * These types define the structure of database tables.
 * In production, generate these using: npx supabase gen types typescript
 * 
 * DATABASE SCHEMA:
 * 
 * -- Users table (extends Supabase auth.users)
 * CREATE TABLE public.profiles (
 *   id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
 *   email TEXT NOT NULL,
 *   display_name TEXT NOT NULL,
 *   photo_url TEXT,
 *   role TEXT DEFAULT 'individual' CHECK (role IN ('individual', 'business', 'admin')),
 *   tin_number TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Enable RLS
 * ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 * 
 * -- Users can read their own profile
 * CREATE POLICY "Users can view own profile" ON public.profiles
 *   FOR SELECT USING (auth.uid() = id);
 * 
 * -- Users can update their own profile
 * CREATE POLICY "Users can update own profile" ON public.profiles
 *   FOR UPDATE USING (auth.uid() = id);
 * 
 * -- Calculations table
 * CREATE TABLE public.calculations (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   type TEXT NOT NULL CHECK (type IN ('pit', 'cit', 'cgt', 'vat')),
 *   inputs JSONB NOT NULL,
 *   results JSONB NOT NULL,
 *   notes TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Enable RLS
 * ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
 * 
 * -- Users can CRUD their own calculations
 * CREATE POLICY "Users can manage own calculations" ON public.calculations
 *   FOR ALL USING (auth.uid() = user_id);
 * 
 * -- Subscriptions table
 * CREATE TABLE public.subscriptions (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
 *   plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
 *   status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
 *   payment_provider TEXT,
 *   payment_reference TEXT,
 *   started_at TIMESTAMPTZ DEFAULT NOW(),
 *   expires_at TIMESTAMPTZ,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Enable RLS
 * ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
 * 
 * -- Users can read their own subscription
 * CREATE POLICY "Users can view own subscription" ON public.subscriptions
 *   FOR SELECT USING (auth.uid() = user_id);
 * 
 * -- Function to automatically create profile on signup
 * CREATE OR REPLACE FUNCTION public.handle_new_user()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   INSERT INTO public.profiles (id, email, display_name, photo_url)
 *   VALUES (
 *     NEW.id,
 *     NEW.email,
 *     COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
 *     NEW.raw_user_meta_data->>'avatar_url'
 *   );
 *   
 *   INSERT INTO public.subscriptions (user_id, plan, status)
 *   VALUES (NEW.id, 'free', 'active');
 *   
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * 
 * -- Trigger to call function on new user
 * CREATE TRIGGER on_auth_user_created
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CalculationType = 'pit' | 'cit' | 'cgt' | 'vat';
export type UserRole = 'individual' | 'business' | 'admin';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          photo_url: string | null;
          role: UserRole;
          tin_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          photo_url?: string | null;
          role?: UserRole;
          tin_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          photo_url?: string | null;
          role?: UserRole;
          tin_number?: string | null;
          updated_at?: string;
        };
      };
      calculations: {
        Row: {
          id: string;
          user_id: string;
          type: CalculationType;
          inputs: Json;
          results: Json;
          notes: string | null;
          is_saved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: CalculationType;
          inputs: Json;
          results: Json;
          notes?: string | null;
          is_saved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: CalculationType;
          inputs?: Json;
          results?: Json;
          notes?: string | null;
          is_saved?: boolean;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          payment_provider: string | null;
          payment_reference: string | null;
          started_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          payment_provider?: string | null;
          payment_reference?: string | null;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          payment_provider?: string | null;
          payment_reference?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

/**
 * Helper types for easier usage
 */
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Calculation = Database['public']['Tables']['calculations']['Row'];
export type CalculationInsert = Database['public']['Tables']['calculations']['Insert'];
export type CalculationUpdate = Database['public']['Tables']['calculations']['Update'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];

/**
 * Calculation input/result types for type safety
 */
export interface PITCalculationData {
  type: 'pit';
  inputs: {
    incomes: { type: string; amount: number }[];
    deductions: { type: string; amount: number }[];
    isResident: boolean;
    daysInNigeria: number;
  };
  results: {
    grossIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    totalTax: number;
    netTakeHome: number;
    effectiveRate: number;
    isExempt: boolean;
  };
}

export interface CITCalculationData {
  type: 'cit';
  inputs: {
    turnover: number;
    assessableProfits: number;
    companyType: 'domestic' | 'multinational';
    isMultinationalSubject: boolean;
    foreignProfits?: number;
    distributedForeignProfits?: number;
  };
  results: {
    companySize: 'small' | 'other';
    citAmount: number;
    developmentLevy: number;
    minimumTaxTopUp: number;
    cfcTax: number;
    totalTaxPayable: number;
    effectiveTaxRate: number;
  };
}

export interface CGTCalculationData {
  type: 'cgt';
  inputs: {
    taxpayerType: 'individual' | 'company';
    saleProceeds: number;
    acquisitionCost: number;
    improvementCosts?: number;
    transferCosts?: number;
    companyTurnover?: number;
    isOffshoreTransfer?: boolean;
  };
  results: {
    capitalGain: number;
    cgtAmount: number;
    netProceeds: number;
    effectiveRate: number;
    isExempt: boolean;
  };
}

export interface VATCalculationData {
  type: 'vat';
  inputs: {
    mode: 'simple' | 'business';
    amount?: number;
    calculationType?: 'inclusive' | 'exclusive';
    outputVAT?: number;
    inputVAT?: number;
  };
  results: {
    vatAmount?: number;
    netAmount?: number;
    grossAmount?: number;
    netVAT?: number;
    isPayable?: boolean;
    isRefundable?: boolean;
  };
}

export type CalculationData =
  | PITCalculationData
  | CITCalculationData
  | CGTCalculationData
  | VATCalculationData;

/**
 * Filing Reminders Table
 * 
 * CREATE TABLE public.filing_reminders (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   tax_type TEXT NOT NULL CHECK (tax_type IN ('pit', 'cit', 'cgt', 'vat')),
 *   title TEXT NOT NULL,
 *   due_date DATE NOT NULL,
 *   email TEXT NOT NULL,
 *   is_active BOOLEAN DEFAULT true,
 *   reminder_7_days_sent BOOLEAN DEFAULT false,
 *   reminder_1_day_sent BOOLEAN DEFAULT false,
 *   reminder_due_sent BOOLEAN DEFAULT false,
 *   notes TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Enable RLS
 * ALTER TABLE public.filing_reminders ENABLE ROW LEVEL SECURITY;
 * 
 * -- Users can CRUD their own reminders
 * CREATE POLICY "Users can manage own reminders" ON public.filing_reminders
 *   FOR ALL USING (auth.uid() = user_id);
 */

export interface FilingReminder {
  id: string;
  user_id: string;
  tax_type: CalculationType;
  title: string;
  due_date: string;
  email: string;
  is_active: boolean;
  reminder_7_days_sent: boolean;
  reminder_1_day_sent: boolean;
  reminder_due_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilingReminderInsert {
  id?: string;
  user_id: string;
  tax_type: CalculationType;
  title: string;
  due_date: string;
  email: string;
  is_active?: boolean;
  notes?: string | null;
}

export interface FilingReminderUpdate {
  tax_type?: CalculationType;
  title?: string;
  due_date?: string;
  email?: string;
  is_active?: boolean;
  notes?: string | null;
  reminder_7_days_sent?: boolean;
  reminder_1_day_sent?: boolean;
  reminder_due_sent?: boolean;
  updated_at?: string;
}

/**
 * Analytics helper types
 */
export interface MonthlyTaxData {
  month: string;
  total: number;
  pit: number;
  cit: number;
  cgt: number;
  vat: number;
}

export interface TaxTypeDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TaxTrendData {
  date: string;
  amount: number;
}
