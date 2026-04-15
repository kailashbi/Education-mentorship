from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, MentorProfile, MenteeProfile

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_suspended', 'date_joined']
    list_filter = ['role', 'is_suspended', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('MentorHub', {'fields': ('role', 'bio', 'profile_picture', 'phone', 'is_suspended', 'is_verified')}),
    )

@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'skills', 'experience_years', 'average_rating', 'total_sessions']

@admin.register(MenteeProfile)
class MenteeProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'education']
