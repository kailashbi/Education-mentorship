from django.db import models
from django.utils import timezone
from accounts.models import User


class MentorshipSubscription(models.Model):
    PLAN_CHOICES = [
        ('single', 'Single 1-on-1 Session'),
        ('1_month', '1-Month Mentorship Plan'),
        ('3_months', '3-Month Career Transformation Plan'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    mentee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentorship_subscriptions')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentor_subscribers')
    plan_type = models.CharField(max_length=20, choices=PLAN_CHOICES, default='single')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)
    
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    sessions_included = models.IntegerField(default=1)
    sessions_used = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_currently_active(self):
        if self.status != 'active':
            return False
        if self.end_date and timezone.now() > self.end_date:
            return False
        if self.plan_type == 'single' and self.sessions_used >= self.sessions_included:
            return False
        return True

    def __str__(self):
        return f"{self.mentee.username} → {self.mentor.username} ({self.get_plan_type_display()}) [{self.status}]"


class PaymentTransaction(models.Model):
    STATUS_CHOICES = [
        ('created', 'Order Created'),
        ('success', 'Payment Successful'),
        ('failed', 'Payment Failed'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_payments')
    subscription = models.ForeignKey(MentorshipSubscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    order_id = models.CharField(max_length=100)
    payment_id = models.CharField(max_length=100, blank=True)
    signature = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    plan_type = models.CharField(max_length=20, default='single')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.order_id} - ₹{self.amount} ({self.status})"


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
    subscription = models.ForeignKey(MentorshipSubscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='session_requests')
    topic = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    proposed_date = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=True)
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
