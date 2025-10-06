from django.urls import path
from . import views_catering

urlpatterns = [
    # List all events or create a new one
    path("events", views_catering.catering_events, name="catering_events"),

    # Retrieve, update, or delete a single event by ID
    path("events/<uuid:event_id>", views_catering.catering_event_detail, name="catering_event_detail"),

    # Update menu items for a specific event
    path("events/<uuid:event_id>/menu", views_catering.catering_event_menu, name="catering_event_menu"),

    # List upcoming events
    path("events/upcoming", views_catering.catering_events_upcoming, name="catering_events_upcoming"),
]
