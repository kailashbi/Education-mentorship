from django.contrib import admin
from .models import SessionRequest, LiveSession, Review

@admin.register(SessionRequest)
class SessionRequestAdmin(admin.ModelAdmin):
    list_display = ['mentee', 'mentor', 'topic', 'status', 'proposed_date']
    list_filter = ['status']

@admin.register(LiveSession)
class LiveSessionAdmin(admin.ModelAdmin):
    list_display = ['mentor', 'mentee', 'channel_name', 'is_active', 'started_at']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['mentee', 'mentor', 'rating', 'created_at']
