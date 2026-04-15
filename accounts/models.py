from django.db import models
from django.contrib.auth.models import AbstractUser


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
    is_verified = models.BooleanField(default=True)
    is_suspended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class MentorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    skills = models.TextField(help_text="Comma-separated skills")
    experience_years = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    availability = models.TextField(blank=True, help_text="e.g. Mon-Fri 9am-5pm")
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    total_sessions = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    total_reviews = models.IntegerField(default=0)

    def get_skills_list(self):
        return [s.strip() for s in self.skills.split(',') if s.strip()]

    def update_rating(self):
        from sessions_app.models import Review
        reviews = Review.objects.filter(mentor=self.user)
        if reviews.exists():
            total = sum(r.rating for r in reviews)
            self.average_rating = round(total / reviews.count(), 1)
            self.total_reviews = reviews.count()
            self.save()

    def __str__(self):
        return f"Mentor: {self.user.username}"


class MenteeProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentee_profile')
    interests = models.TextField(blank=True, help_text="Comma-separated interests")
    learning_goals = models.TextField(blank=True)
    education = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Mentee: {self.user.username}"
