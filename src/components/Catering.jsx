import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Utensils } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewEventModal } from './catering/NewEventModal';
import { CalendarViewModal } from './catering/CalendarViewModal';
import { EventDetailsModal } from './catering/EventDetailsModal';
import { MenuItemsModal } from './catering/MenuItemsModal';
import { CateringEventTable } from './catering/CateringEventTable';
import { EventSearchAndFilters } from './catering/EventSearchAndFilters';
import { EventDetailsCard } from './catering/EventDetailsCard';
import { CateringSidebar } from './catering/CateringSidebar';
import { toast } from 'sonner';
import cateringService from '@/api/services/cateringService';
import { usePOSData } from '@/hooks/usePOSData';

const Catering = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('upcoming');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showMenuItemsModal, setShowMenuItemsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const defaultEvents = [
    {
      id: '1',
      name: 'Corporate Lunch Meeting',
      client: 'ABC Technologies',
      date: '2025-04-20',
      time: '12:30 - 14:00',
      location: 'ABC Technologies HQ, Conference Room B',
      attendees: 25,
      status: 'scheduled',
      total: 625.0,
      contactPerson: { name: 'John Smith', phone: '555-123-4567' },
    },
    {
      id: '2',
      name: 'Executive Breakfast',
      client: 'Global Finance',
      date: '2025-04-21',
      time: '08:00 - 09:30',
      location: 'Global Finance Tower, 15th Floor',
      attendees: 12,
      status: 'scheduled',
      total: 360.0,
      contactPerson: { name: 'Maria Garcia', phone: '555-987-6543' },
    },
    {
      id: '3',
      name: 'Team Building Lunch',
      client: 'InnovateTech',
      date: '2025-05-05',
      time: '11:30 - 13:30',
      location: 'City Park Pavilion',
      attendees: 45,
      status: 'scheduled',
      total: 1125.0,
      contactPerson: { name: 'Alex Johnson', phone: '555-456-7890' },
    },
    {
      id: '4',
      name: 'Charity Gala Dinner',
      client: 'Hope Foundation',
      date: '2025-10-30',
      time: '18:00 - 22:00',
      location: 'Grand Hotel Ballroom',
      attendees: 120,
      status: 'scheduled',
      total: 6000.0,
      contactPerson: { name: 'Sarah Williams', phone: '555-789-0123' },
    },
    {
      id: '5',
      name: 'Faculty Appreciation Dinner',
      client: 'Cebu Technological University',
      date: '2025-10-05',
      time: '18:00 - 21:00',
      location: 'CTU Main Campus, Function Hall',
      attendees: 80,
      status: 'scheduled',
      total: 2400.0,
      contactPerson: { name: 'Prof. Angelica Reyes', phone: '0917-555-1234' },
    },
  ];

  // 🔹 Load events from localStorage if available
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('cateringEvents');
    return saved ? JSON.parse(saved) : defaultEvents;
  });

  const [loadingEvents, setLoadingEvents] = useState(false);

  // 🔹 Sync state to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem('cateringEvents', JSON.stringify(events));
  }, [events]);

  const { categories: menuCategories } = usePOSData();

  const filteredMenuCategories = useMemo(() => {
    return (menuCategories || []).filter(
      (category) => (category.id || '').toLowerCase() !== 'all'
    );
  }, [menuCategories]);

  const menuItems = useMemo(() => {
    const map = new Map();
    filteredMenuCategories.forEach((category) => {
      (category.items || []).forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, {
            ...item,
            category: item.category || category.name,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [filteredMenuCategories]);

  // 🔹 Event Handlers
  useEffect(() => {
    let ignore = false;

    const loadEvents = async () => {
      setLoadingEvents(true);
      try {
        const response = await cateringService.listEvents();
        if (!ignore && response && 'data' in response) {
          setEvents(Array.isArray(response.data) ? response.data : []);
          if (response.success === false) {
            toast.warning(
              'Using cached catering events because syncing with the server failed.'
            );
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error('Failed to load catering events', error);
          toast.error(
            'Unable to load catering events from the server. Showing cached data.'
          );
        }
      } finally {
        if (!ignore) {
          setLoadingEvents(false);
        }
      }
    };

    loadEvents();

    return () => {
      ignore = true;
    };
  }, []);

  const updateEventInState = useCallback((updatedEvent) => {
    if (!updatedEvent || !updatedEvent.id) return;
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
      )
    );
    setSelectedEvent((prevSelected) =>
      prevSelected?.id === updatedEvent.id
        ? { ...prevSelected, ...updatedEvent }
        : prevSelected
    );
  }, []);

  const handleCreateEvent = useCallback(async (newEvent) => {
    try {
      const response = await cateringService.createEvent(newEvent);
      const createdEvent = response?.data
        ? response.data
        : { ...newEvent, id: newEvent.id ?? Date.now().toString() };
      setEvents((prev) => [...prev, createdEvent]);
      toast.success('Event created successfully!');
      return createdEvent;
    } catch (error) {
      console.error('Failed to create catering event', error);
      toast.error('Failed to create event. Please try again.');
      throw error;
    }
  }, []);

  const handleUpdateEvent = useCallback(
    async (updatedEvent) => {
      if (!updatedEvent?.id) return null;
      try {
        const response = await cateringService.updateEvent(
          updatedEvent.id,
          updatedEvent
        );
        const savedEvent = response?.data ?? updatedEvent;
        updateEventInState(savedEvent);
        toast.success('Event updated successfully!');
        return savedEvent;
      } catch (error) {
        console.error('Failed to update catering event', error);
        toast.error('Failed to update event. Please try again.');
        throw error;
      }
    },
    [updateEventInState]
  );

   const handleViewDetails = useCallback(
    (event) => {
      if (!event) return;
      const current = events.find((item) => item.id === event.id) ?? event;
      setSelectedEvent(current);
      setShowEventDetailsModal(true);
    },
    [events]
  );

  const handleMenuItems = useCallback(
    (event, readOnly = false) => {
      if (!event) return;
      const current = events.find((item) => item.id === event.id) ?? event;
      setSelectedEvent({ ...current, readOnly });
      setShowMenuItemsModal(true);
    },
    [events]
  );

  const handleCancelEvent = useCallback(
    async (event) => {
      if (!event?.id) return;
      try {
        const response = await cateringService.updateStatus(event.id, 'cancelled');
        const updated = response?.data ?? { ...event, status: 'cancelled' };
        updateEventInState(updated);
        toast.success(`Event "${event.name}" has been cancelled`);
      } catch (error) {
        console.error('Failed to cancel catering event', error);
        toast.error('Failed to cancel event. Please try again.');
      }
    },
    [updateEventInState]
  );

  const handleRestoreEvent = useCallback(
    async (event) => {
      if (!event?.id) return;
      try {
        const response = await cateringService.updateStatus(event.id, 'scheduled');
        const updated = response?.data ?? { ...event, status: 'scheduled' };
        updateEventInState(updated);
        toast.success(`Event "${event.name}" has been restored!`);
      } catch (error) {
        console.error('Failed to restore catering event', error);
        toast.error('Failed to restore event. Please try again.');
      }
    },
    [updateEventInState]
  );

  const handleDeleteEvent = useCallback(async (event) => {
    if (!event?.id) return;
    try {
      await cateringService.deleteEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setSelectedEvent((prev) => (prev?.id === event.id ? null : prev));
      toast.success('Event deleted successfully!');
    } catch (error) {
      console.error('Failed to delete catering event', error);
      toast.error('Failed to delete event. Please try again.');
    }
  }, []);

  const handleUpdateMenuItems = useCallback(
    async (eventId, menuItems) => {
      if (!eventId) return null;
      try {
        const response = await cateringService.updateMenuItems(
          eventId,
          menuItems
        );
        if (response?.data) {
          updateEventInState(response.data);
        }
        toast.success('Menu items updated successfully!');
        return response?.data ?? null;
      } catch (error) {
        console.error('Failed to update catering menu items', error);
        toast.error('Failed to update menu items. Please try again.');
        throw error;
      }
    },
    [updateEventInState]
  );

  const handleEditEvent = useCallback(
    (event) => {
      if (!event) return;
      const current = events.find((item) => item.id === event.id) ?? event;
      setSelectedEvent(current);
      setShowNewEventModal(true);
    },
    [events]
  );

  const handleViewFullMenu = useCallback(() => {
    navigate('/pos');
  }, [navigate]);

  // 🔹 Status Badge Variants
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'scheduled':
        return 'outline';
      case 'confirmed':
      case 'in-progress':
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // 🔹 Filter & categorize events
  const filteredEvents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(term) ||
        event.client.toLowerCase().includes(term)
    );
  }, [events, searchTerm]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => {
        const status = (event.status || '').toLowerCase();
        if (status === 'cancelled' || status === 'completed') {
          return false;
        }
        const eventDate = event.date ? new Date(event.date) : null;
        if (!eventDate || Number.isNaN(eventDate.getTime())) {
          return status !== 'cancelled';
        }
        return eventDate >= now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredEvents]);

  const pastEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => {
        const status = (event.status || '').toLowerCase();
        if (status === 'cancelled') {
          return false;
        }
        if (status === 'completed') {
          return true;
        }
        const eventDate = event.date ? new Date(event.date) : null;
        if (!eventDate || Number.isNaN(eventDate.getTime())) {
          return false;
        }
        return eventDate < now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredEvents]);

  const cancelledEvents = useMemo(() => {
    return filteredEvents.filter(
      (event) => (event.status || '').toLowerCase() === 'cancelled'
    );
  }, [filteredEvents]);

  // 🔹 Render
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Catering Management</CardTitle>
              <CardDescription className="mb-4">
                Handle catering orders and events
              </CardDescription>
              {loadingEvents && (
                <p className="text-xs text-muted-foreground">
                  Syncing latest events…
                </p>
              )}
            </div>
            <Button onClick={() => setShowNewEventModal(true)}>
              <PlusCircle className="h-4 w-4 mr-1" /> New Event
            </Button>
          </CardHeader>
            <CardContent className="space-y-4">
              <EventSearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onCalendarView={() => setShowCalendarModal(true)}
              />

              <Tabs defaultValue="upcoming" onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past Events</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="pt-2">
                  {upcomingEvents.length > 0 ? (
                    <CateringEventTable
                      events={upcomingEvents}
                      onViewDetails={handleViewDetails}
                      onMenuItems={handleMenuItems}
                      onCancelEvent={handleCancelEvent}
                      onEditEvent={handleEditEvent}
                      onDeleteEvent={handleDeleteEvent}
                    />
                  ) : (
                    <div className="text-center py-10">
                      <Utensils className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        No upcoming catering events found
                      </p>
                      <Button
                        className="mt-4"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewEventModal(true)}
                      >
                        Create New Event
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past" className="pt-2">
                  {pastEvents.length > 0 ? (
                    <CateringEventTable
                      events={pastEvents}
                      onViewDetails={handleViewDetails}
                      onMenuItems={handleMenuItems}
                    />
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">
                        No past catering events to display
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cancelled" className="pt-2">
                  {cancelledEvents.length > 0 ? (
                    <CateringEventTable
                      events={cancelledEvents}
                      onViewDetails={handleViewDetails}
                      onMenuItems={handleMenuItems}
                      onRestoreEvent={handleRestoreEvent}
                    />
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">
                        No cancelled events to display
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {currentTab === 'upcoming' && upcomingEvents.length > 0 && (
            <EventDetailsCard
              event={upcomingEvents[0]}
              getStatusBadgeVariant={getStatusBadgeVariant}
            />
          )}
        </div>

        <CateringSidebar
          menuItems={menuItems}
          upcomingEvents={upcomingEvents}
          onViewFullMenu={handleViewFullMenu}
        />
      </div>

      <NewEventModal
        open={showNewEventModal}
        onOpenChange={setShowNewEventModal}
        onCreateEvent={handleCreateEvent}
        event={selectedEvent}
        onUpdateEvent={handleUpdateEvent}
      />

      <CalendarViewModal
        open={showCalendarModal}
        onOpenChange={setShowCalendarModal}
        events={events}
      />

      <EventDetailsModal
        open={showEventDetailsModal}
        onOpenChange={setShowEventDetailsModal}
        event={selectedEvent}
      />

      <MenuItemsModal
        open={showMenuItemsModal}
        onOpenChange={setShowMenuItemsModal}
        event={selectedEvent}
        menuItems={menuItems}
        onUpdateMenuItems={handleUpdateMenuItems}
        readOnly={
          selectedEvent?.status === 'cancelled' || currentTab === 'past'
        }
      />
    </>
  );
};

export default Catering;