from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, MentorProfile, MenteeProfile, UserReport

@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'is_suspended', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_suspended', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('MentorHub Custom Fields', {'fields': ('role', 'bio', 'profile_picture', 'phone', 'is_suspended', 'is_verified')}),
    )

@admin.action(description='Approve selected mentors')
def approve_mentors(modeladmin, request, queryset):
    for mentor in queryset:
        mentor.approval_status = 'approved'
        mentor.user.is_verified = True
        mentor.user.save()
        mentor.save()

@admin.action(description='Reject selected mentors')
def reject_mentors(modeladmin, request, queryset):
    for mentor in queryset:
        mentor.approval_status = 'rejected'
        mentor.user.is_verified = False
        mentor.user.save()
        mentor.save()

@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'approval_status', 'skills', 'experience_years', 'hourly_rate', 'average_rating', 'total_sessions', 'applied_at']
    list_filter = ['approval_status', 'experience_years']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email', 'skills']
    actions = [approve_mentors, reject_mentors]

@admin.register(MenteeProfile)
class MenteeProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'education', 'interests']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']

@admin.register(UserReport)
class UserReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'reporter', 'reported_user', 'category', 'status', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['reporter__username', 'reported_user__username', 'description']


