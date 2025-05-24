
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReminderFormProps {
  onSuccess: () => void;
  editingReminder?: any;
  onCancel?: () => void;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ onSuccess, editingReminder, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    editingReminder ? new Date(editingReminder.reminder_date) : undefined
  );
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a reminder date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    const reminderData = {
      full_name: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone_number: formData.get('phoneNumber') as string,
      custom_message: formData.get('customMessage') as string,
      reminder_date: format(selectedDate, 'yyyy-MM-dd'),
      user_id: (await supabase.auth.getUser()).data.user?.id,
    };

    try {
      let error;
      
      if (editingReminder) {
        const { error: updateError } = await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', editingReminder.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('reminders')
          .insert([reminderData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingReminder ? "Reminder updated!" : "Reminder created!",
        description: `Your reminder has been ${editingReminder ? 'updated' : 'scheduled'} for ${format(selectedDate, 'PPP')}.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingReminder ? 'Edit Reminder' : 'Create New Reminder'}</CardTitle>
        <CardDescription>
          {editingReminder ? 'Update your reminder details' : 'Schedule a new reminder with custom message'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter full name"
                defaultValue={editingReminder?.full_name || ''}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                defaultValue={editingReminder?.email || ''}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                defaultValue={editingReminder?.phone_number || ''}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Reminder Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Message</Label>
            <Textarea
              id="customMessage"
              name="customMessage"
              placeholder="Enter your reminder message..."
              defaultValue={editingReminder?.custom_message || ''}
              rows={4}
              required
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingReminder ? 'Update Reminder' : 'Create Reminder'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReminderForm;
