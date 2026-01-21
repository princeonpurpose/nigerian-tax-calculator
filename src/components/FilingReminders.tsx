/**
 * Filing Reminders Component
 * Manage tax filing reminders with email notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminderActive,
  getTaxTypeInfo,
  getDaysUntilDue,
  getUrgencyLevel,
} from '@/services/remindersService';
import type { FilingReminder, CalculationType } from '@/types/database';

const TAX_TYPES: { value: CalculationType; label: string; icon: string }[] = [
  { value: 'pit', label: 'Personal Income Tax', icon: '👤' },
  { value: 'cit', label: 'Company Income Tax', icon: '🏢' },
  { value: 'cgt', label: 'Capital Gains Tax', icon: '📈' },
  { value: 'vat', label: 'Value Added Tax', icon: '🧾' },
];

export function FilingReminders() {
  const { user, isAuthenticated } = useAuth();
  const [reminders, setReminders] = useState<FilingReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    tax_type: 'pit' as CalculationType,
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    email: user?.email || '',
    notes: '',
  });

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await getReminders();
      if (fetchError) throw fetchError;
      setReminders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReminders();
    }
  }, [isAuthenticated, fetchReminders]);

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email, formData.email]);

  const resetForm = () => {
    setFormData({
      title: '',
      tax_type: 'pit',
      due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      email: user?.email || '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await updateReminder(editingId, {
          title: formData.title,
          tax_type: formData.tax_type,
          due_date: formData.due_date,
          email: formData.email,
          notes: formData.notes || null,
        });
        if (error) throw error;
      } else {
        const { error } = await createReminder({
          title: formData.title,
          tax_type: formData.tax_type,
          due_date: formData.due_date,
          email: formData.email,
          notes: formData.notes || null,
        });
        if (error) throw error;
      }
      
      resetForm();
      fetchReminders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save reminder');
    }
  };

  const handleEdit = (reminder: FilingReminder) => {
    setFormData({
      title: reminder.title,
      tax_type: reminder.tax_type,
      due_date: reminder.due_date,
      email: reminder.email,
      notes: reminder.notes || '',
    });
    setEditingId(reminder.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    
    const { error } = await deleteReminder(id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      setReminders(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await toggleReminderActive(id, !isActive);
    if (error) {
      alert(`Failed to update: ${error.message}`);
    } else {
      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, is_active: !isActive } : r
      ));
    }
  };

  // Separate reminders into upcoming and past
  const now = new Date();
  const upcomingReminders = reminders.filter(r => new Date(r.due_date) >= now);
  const pastReminders = reminders.filter(r => new Date(r.due_date) < now);

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in Required</h2>
        <p className="text-gray-600">Please sign in to manage your filing reminders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>⏰</span> Filing Reminders
          </h1>
          <p className="text-gray-600">Never miss a tax filing deadline</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2',
            showForm
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          )}
        >
          {showForm ? (
            <>✕ Cancel</>
          ) : (
            <>➕ Add Reminder</>
          )}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-6 animate-fade-in">
          <h3 className="font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Reminder' : 'Create New Reminder'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Annual PIT Return"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Type
                </label>
                <select
                  value={formData.tax_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_type: e.target.value as CalculationType }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {TAX_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email for Reminders
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-medium">📧 Email Notifications</p>
              <p>You'll receive email reminders:</p>
              <ul className="list-disc list-inside mt-1">
                <li>7 days before the due date</li>
                <li>1 day before the due date</li>
                <li>On the due date</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                {editingId ? 'Update Reminder' : 'Create Reminder'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading reminders...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error loading reminders</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && reminders.length === 0 && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No reminders yet</h3>
          <p className="text-gray-600 mb-4">
            Set up reminders to never miss a tax filing deadline.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Create Your First Reminder
          </button>
        </div>
      )}

      {/* Upcoming Reminders */}
      {!isLoading && upcomingReminders.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>📅</span> Upcoming Deadlines ({upcomingReminders.length})
          </h3>
          <div className="space-y-3">
            {upcomingReminders.map(reminder => {
              const daysUntil = getDaysUntilDue(reminder.due_date);
              const urgency = getUrgencyLevel(daysUntil);
              const typeInfo = getTaxTypeInfo(reminder.tax_type);
              
              return (
                <div
                  key={reminder.id}
                  className={cn(
                    'bg-white rounded-lg border p-4 transition',
                    !reminder.is_active && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Urgency Indicator */}
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                      urgency === 'urgent' && 'bg-red-500',
                      urgency === 'warning' && 'bg-amber-500',
                      urgency === 'normal' && 'bg-green-500'
                    )} />
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded', typeInfo.bgColor, typeInfo.color)}>
                          {reminder.tax_type.toUpperCase()}
                        </span>
                        <h4 className="font-medium text-gray-900">{reminder.title}</h4>
                        {!reminder.is_active && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            Paused
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          📅 {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                        </span>
                        <span className={cn(
                          'font-medium',
                          urgency === 'urgent' && 'text-red-600',
                          urgency === 'warning' && 'text-amber-600',
                          urgency === 'normal' && 'text-green-600'
                        )}>
                          {daysUntil === 0 ? '⚠️ Due Today!' : 
                           daysUntil === 1 ? '⏰ Due Tomorrow' : 
                           `${daysUntil} days left`}
                        </span>
                        <span className="flex items-center gap-1">
                          📧 {reminder.email}
                        </span>
                      </div>
                      
                      {reminder.notes && (
                        <p className="text-sm text-gray-500 mt-2">{reminder.notes}</p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(reminder.id, reminder.is_active)}
                        className={cn(
                          'p-2 rounded hover:bg-gray-100 transition',
                          reminder.is_active ? 'text-green-600' : 'text-gray-400'
                        )}
                        title={reminder.is_active ? 'Pause reminder' : 'Activate reminder'}
                      >
                        {reminder.is_active ? '🔔' : '🔕'}
                      </button>
                      <button
                        onClick={() => handleEdit(reminder)}
                        className="p-2 rounded hover:bg-gray-100 text-blue-600 transition"
                        title="Edit reminder"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        className="p-2 rounded hover:bg-red-50 text-red-600 transition"
                        title="Delete reminder"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Reminders */}
      {!isLoading && pastReminders.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <span>📋</span> Past Deadlines ({pastReminders.length})
          </h3>
          <div className="space-y-2">
            {pastReminders.map(reminder => {
              const typeInfo = getTaxTypeInfo(reminder.tax_type);
              
              return (
                <div
                  key={reminder.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-3 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded', typeInfo.bgColor, typeInfo.color)}>
                        {reminder.tax_type.toUpperCase()}
                      </span>
                      <span className="text-gray-700">{reminder.title}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="text-gray-400 hover:text-red-600 transition p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">📋 Common Filing Deadlines</h4>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-blue-700">
          <div>
            <span className="font-medium">PAYE (Monthly):</span> 10th of following month
          </div>
          <div>
            <span className="font-medium">VAT (Monthly):</span> 21st of following month
          </div>
          <div>
            <span className="font-medium">PIT Annual Return:</span> March 31
          </div>
          <div>
            <span className="font-medium">CIT Annual Return:</span> 6 months after year-end
          </div>
        </div>
      </div>
    </div>
  );
}
