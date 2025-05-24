
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import ReminderForm from '@/components/reminders/ReminderForm';
import ReminderList from '@/components/reminders/ReminderList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingReminder(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (reminder: any) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userEmail={user?.email} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            {!showForm ? (
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowForm(true)} 
                  className="w-full"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Reminder
                </Button>
                <div className="text-center text-gray-600">
                  <p>Click the button above to create your first reminder.</p>
                </div>
              </div>
            ) : (
              <ReminderForm
                onSuccess={handleFormSuccess}
                editingReminder={editingReminder}
                onCancel={handleCancel}
              />
            )}
          </div>
          
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Reminders</h2>
              <p className="text-gray-600">Manage and track your scheduled reminders.</p>
            </div>
            <ReminderList 
              onEdit={handleEdit} 
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
