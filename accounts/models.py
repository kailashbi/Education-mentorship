from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):


    ROLE_CHOICES = [
        ('mentor', 'Mentor'),
        ('mentee', 'Mentee'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='mentee')
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True)
    is_verified = models.BooleanField(default=False)  # default False for mentors until admin approval
    is_suspended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class MentorProfile(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    skills = models.TextField(help_text="Comma-separated skills")
    experience_years = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=499.00)
    monthly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=1499.00, help_text="1-Month Mentorship (4 Sessions + Chat)")
    quarterly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=3999.00, help_text="3-Month Mentorship (12 Sessions + Projects + Mock Interviews)")

    availability = models.TextField(blank=True, help_text="e.g. Mon-Fri 9am-5pm")
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    
    # Demo Video and Application fields
    demo_video = models.FileField(upload_to='mentor_videos/', blank=True, null=True)
    demo_video_url = models.URLField(blank=True, help_text="Alternative video link (e.g., YouTube/Loom/Drive)")
    approval_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    applied_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_mentors')
    
    total_sessions = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    total_reviews = models.IntegerField(default=0)

    def get_skills_list(self):
        return [s.strip() for s in self.skills.split(',') if s.strip()]

    def is_approved(self):
        return self.approval_status == 'approved'

    def update_rating(self):
        from sessions_app.models import Review
        reviews = Review.objects.filter(mentor=self.user)
        if reviews.exists():
            total = sum(r.rating for r in reviews)
            self.average_rating = round(total / reviews.count(), 1)
            self.total_reviews = reviews.count()
            self.save()

    def __str__(self):
        return f"Mentor: {self.user.username} [{self.approval_status}]"


class MenteeProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentee_profile')
    interests = models.TextField(blank=True, help_text="Comma-separated interests")
    learning_goals = models.TextField(blank=True)
    education = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Mentee: {self.user.username}"


class UserReport(models.Model):
    CATEGORY_CHOICES = [
        ('chat_abuse', 'Harassment / Abusive Chat'),
        ('inappropriate_behavior', 'Inappropriate Behavior'),
        ('scam_fraud', 'Scam / Financial Fraud'),
        ('no_show', 'No-Show / Unresponsive'),
        ('policy_violation', 'Platform Terms Violation'),
        ('other', 'Other Issue'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('investigating', 'Under Investigation'),
        ('resolved', 'Resolved (Action Taken)'),
        ('dismissed', 'Dismissed (No Violation)'),
    ]
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_filed')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_against')
    chat_room = models.ForeignKey('chat.ChatRoom', on_delete=models.SET_NULL, null=True, blank=True, related_name='incident_reports')
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default='chat_abuse')
    description = models.TextField(help_text="Detailed description of the issue or chat violation")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, help_text="Internal notes by admin after analyzing chat")
    action_taken = models.CharField(max_length=50, blank=True, help_text="e.g. Account Suspended, Warning Issued, Dismissed")
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Report #{self.id}: {self.reporter.username} against {self.reported_user.username} [{self.category}]"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('warning', 'Official Admin Warning'),
        ('suspension', 'Account Suspended'),
        ('approval', 'Mentor Approved'),
        ('rejection', 'Mentor Application Update'),
        ('session_request', 'Session Request'),
        ('session_accepted', 'Session Accepted'),
        ('session_rejected', 'Session Rejected'),
        ('review', 'New Review'),
        ('info', 'General Notification'),
    ]
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, default='info')
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title} [{self.notification_type}]"



