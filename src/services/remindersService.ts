/**
 * Filing Reminders Service
 * 
 * PRODUCTION-READY IMPLEMENTATION
 * 
 * Handles CRUD operations for tax filing reminders in Supabase.
 * Falls back to demo mode with in-memory storage when Supabase is not configured.
 * 
 * Features:
 * - Create, read, update, delete reminders
 * - Toggle active status
 * - Calculate urgency levels
 * - Demo mode for testing without database
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { FilingReminder, FilingReminderInsert, FilingReminderUpdate, CalculationType } from '../types/database';

// Demo mode storage - only used when Supabase is not configured
// Stored in memory, resets on page reload
let demoReminders: FilingReminder[] = [];
let demoIdCounter = 1;

/**
 * Initialize demo data - only for development/preview
 */
function initDemoReminders(userId: string): void {
  if (demoReminders.length > 0) return;
  
  const now = new Date();
  
  demoReminders = [
    {
      id: `demo-${demoIdCounter++}`,
      user_id: userId,
      tax_type: 'pit',
      title: 'Annual PIT Return',
      due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      email: 'demo@example.com',
      is_active: true,
      reminder_7_days_sent: false,
      reminder_1_day_sent: false,
      reminder_due_sent: false,
      notes: 'Submit annual personal income tax return to NRS',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: `demo-${demoIdCounter++}`,
      user_id: userId,
      tax_type: 'vat',
      title: 'Monthly VAT Return',
      due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      email: 'demo@example.com',
      is_active: true,
      reminder_7_days_sent: false,
      reminder_1_day_sent: false,
      reminder_due_sent: false,
      notes: 'File monthly VAT return by 21st',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  ];
}

/**
 * Get all reminders for the current user
 */
export async function getReminders(): Promise<{ data: FilingReminder[] | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    initDemoReminders('demo-user');
    return { data: [...demoReminders], error: null };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('filing_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return { data: data as FilingReminder[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get upcoming reminders (due within specified days)
 */
export async function getUpcomingReminders(
  withinDays: number = 30
): Promise<{ data: FilingReminder[] | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    initDemoReminders('demo-user');
    const futureDate = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = demoReminders.filter(r => {
      const dueDate = new Date(r.due_date);
      return r.is_active && dueDate >= today && dueDate <= futureDate;
    });
    return { data: upcoming, error: null };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('filing_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('due_date', today)
      .lte('due_date', futureDate)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return { data: data as FilingReminder[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new reminder
 */
export async function createReminder(
  reminder: Omit<FilingReminderInsert, 'user_id'>
): Promise<{ data: FilingReminder | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    const newReminder: FilingReminder = {
      id: `demo-${demoIdCounter++}`,
      user_id: 'demo-user',
      tax_type: reminder.tax_type,
      title: reminder.title,
      due_date: reminder.due_date,
      email: reminder.email,
      is_active: reminder.is_active ?? true,
      reminder_7_days_sent: false,
      reminder_1_day_sent: false,
      reminder_due_sent: false,
      notes: reminder.notes ?? null,
      created_at: now,
      updated_at: now,
    };
    demoReminders.push(newReminder);
    return { data: newReminder, error: null };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('filing_reminders')
      .insert({
        ...reminder,
        user_id: user.id,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return { data: data as FilingReminder, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a reminder
 */
export async function updateReminder(
  id: string,
  updates: FilingReminderUpdate
): Promise<{ data: FilingReminder | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    const index = demoReminders.findIndex(r => r.id === id);
    if (index === -1) {
      return { data: null, error: new Error('Reminder not found') };
    }
    demoReminders[index] = {
      ...demoReminders[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { data: demoReminders[index], error: null };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('filing_reminders')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as FilingReminder, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(id: string): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    const index = demoReminders.findIndex(r => r.id === id);
    if (index !== -1) {
      demoReminders.splice(index, 1);
    }
    return { error: null };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await supabase
      .from('filing_reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Toggle reminder active status
 */
export async function toggleReminderActive(
  id: string,
  isActive: boolean
): Promise<{ data: FilingReminder | null; error: Error | null }> {
  return updateReminder(id, { is_active: isActive });
}

/**
 * Get tax type display info with colors
 */
export function getTaxTypeInfo(taxType: CalculationType): { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
} {
  const info: Record<CalculationType, { label: string; color: string; bgColor: string; icon: string }> = {
    pit: { label: 'Personal Income Tax', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '👤' },
    cit: { label: 'Company Income Tax', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '🏢' },
    cgt: { label: 'Capital Gains Tax', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: '📈' },
    vat: { label: 'Value Added Tax', color: 'text-green-700', bgColor: 'bg-green-100', icon: '🧾' },
  };
  return info[taxType];
}

/**
 * Calculate days until due date
 * Returns negative number if overdue
 */
export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get urgency level based on days until due
 */
export function getUrgencyLevel(daysUntilDue: number): 'overdue' | 'urgent' | 'warning' | 'normal' {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 1) return 'urgent';
  if (daysUntilDue <= 7) return 'warning';
  return 'normal';
}

/**
 * Get urgency color classes
 */
export function getUrgencyColors(urgency: ReturnType<typeof getUrgencyLevel>): {
  bg: string;
  text: string;
  border: string;
} {
  const colors = {
    overdue: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    urgent: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    normal: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  };
  return colors[urgency];
}

/**
 * Format due date message
 */
export function formatDueMessage(daysUntilDue: number): string {
  if (daysUntilDue < -1) return `${Math.abs(daysUntilDue)} days overdue`;
  if (daysUntilDue === -1) return 'Due yesterday';
  if (daysUntilDue === 0) return 'Due today!';
  if (daysUntilDue === 1) return 'Due tomorrow';
  if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
  if (daysUntilDue <= 30) return `Due in ${Math.ceil(daysUntilDue / 7)} weeks`;
  return `Due in ${Math.ceil(daysUntilDue / 30)} months`;
}
