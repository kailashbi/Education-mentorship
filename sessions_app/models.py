from django.db import models
from accounts.models import User


class SessionRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    mentee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    topic = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    proposed_date = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    mentor_note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.mentee.username} → {self.mentor.username}: {self.topic}"


class LiveSession(models.Model):
    session_request = models.OneToOneField(SessionRequest, on_delete=models.CASCADE, related_name='live_session')
    mentee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentee_sessions')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentor_sessions')
    channel_name = models.CharField(max_length=100, unique=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    agora_token = models.TextField(blank=True)

    def __str__(self):
        return f"Session: {self.mentor.username} & {self.mentee.username}"


class Review(models.Model):
    session = models.OneToOneField(SessionRequest, on_delete=models.CASCADE, related_name='review')
    mentee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.mentee.username} for {self.mentor.username}: {self.rating}★"
