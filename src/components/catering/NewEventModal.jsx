import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Users, MapPin, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const NewEventModal = ({
  open,
  onOpenChange,
  onCreateEvent,
  event,
  onUpdateEvent,
}) => {
  const [formData, setFormData] = useState({
    name: event?.name || '',
    client: event?.client || '',
    date: event?.date ? new Date(event.date) : undefined,
    startTime: event?.time ? event.time.split(' - ')[0] : '',
    endTime: event?.time ? event.time.split(' - ')[1] : '',
    location: event?.location || '',
    attendees: event?.attendees || '',
    contactName: event?.contactPerson?.name || '',
    contactPhone: event?.contactPerson?.phone || '',
    notes: event?.notes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        client: event.client,
        date: new Date(event.date),
        startTime: event.time.split(' - ')[0],
        endTime: event.time.split(' - ')[1],
        location: event.location,
        attendees: event.attendees,
        contactName: event.contactPerson?.name || '',
        contactPhone: event.contactPerson?.phone || '',
        notes: event.notes || '',
      });
    }
  }, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.client ||
      !formData.date ||
      !formData.startTime ||
      !formData.endTime
    ) {
      return;
    }

    const baseEvent = {
      name: formData.name,
      client: formData.client,
      date: format(formData.date, 'yyyy-MM-dd'),
      startTime: formData.startTime,
      endTime: formData.endTime,
      time: `${formData.startTime} - ${formData.endTime}`,
      location: formData.location,
      attendees: parseInt(formData.attendees) || 0,
      status: event?.status ?? 'scheduled',
      total: (parseInt(formData.attendees) || 0) * 25.0,
      contactPerson: {
        name: formData.contactName,
        phone: formData.contactPhone,
      },
      notes: formData.notes,
    };

    let success = false;
    setIsSubmitting(true);

    try {
      if (event && onUpdateEvent) {
        const updatedEvent = {
          ...event,
          ...baseEvent,
        };
        await onUpdateEvent(updatedEvent);
      } else if (onCreateEvent) {
        await onCreateEvent(baseEvent);
      }
      success = true;
    } catch (error) {
      console.error('Failed to submit catering event form', error);
    } finally {
      setIsSubmitting(false);
    }

    if (!success) {
      return;
    }

    setFormData({
      name: '',
      client: '',
      date: undefined,
      startTime: '',
      endTime: '',
      location: '',
      attendees: '',
      contactName: '',
      contactPhone: '',
      notes: '',
    });

    onOpenChange(false);
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            {event ? 'Edit Catering Event' : 'Create New Catering Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-name" className="font-bold">
                Event Name *
              </Label>
              <Input
                id="event-name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Corporate Lunch Meeting"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client" className="font-bold">
                Client *
              </Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => updateFormData('client', e.target.value)}
                placeholder="ABC Technologies"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => updateFormData('date', date)}
                    initialFocus
                    className="p-3 w-full max-w-full pointer-events-auto"
                    classNames={{
                      day: 'text-gray-800 rounded-full transition-colors w-12 h-12 flex items-center justify-center',
                      day_selected: 'bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow',
                      day_selected_hover: 'bg-primary/90',
                      day_today: 'text-gray-900 font-semibold',
                      day_disabled: 'text-gray-400 cursor-not-allowed',
                      day_outside: 'text-gray-400',
                      day_focus: 'ring-0 bg-transparent',
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time" className="font-bold">
                Start Time *
              </Label>
              <Input
                id="start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateFormData('startTime', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time" className="font-bold">
                End Time *
              </Label>
              <Input
                id="end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) => updateFormData('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="font-bold">
              Location
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                placeholder="Conference Room B, ABC Technologies HQ"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees" className="font-bold">
              Number of Attendees
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="attendees"
                type="number"
                value={formData.attendees}
                onChange={(e) => updateFormData('attendees', e.target.value)}
                placeholder="25"
                className="pl-10"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name" className="font-bold">
                Contact Person
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-name"
                  value={formData.contactName}
                  onChange={(e) => updateFormData('contactName', e.target.value)}
                  placeholder="John Smith"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone" className="font-bold">
                Contact Phone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-phone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => updateFormData('contactPhone', e.target.value)}
                  placeholder="555-123-4567"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-bold">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Special dietary requirements, setup preferences, etc."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="close"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {event ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};