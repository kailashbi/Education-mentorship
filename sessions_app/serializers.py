from rest_framework import serializers
from .models import SessionRequest, LiveSession, Review, MentorshipSubscription, PaymentTransaction
from accounts.serializers import UserSerializer


class MentorshipSubscriptionSerializer(serializers.ModelSerializer):
    mentor_details = UserSerializer(source='mentor', read_only=True)
    mentee_details = UserSerializer(source='mentee', read_only=True)
    is_active_plan = serializers.SerializerMethodField()

    class Meta:
        model = MentorshipSubscription
        fields = [
            'id', 'mentee', 'mentee_details', 'mentor', 'mentor_details',
            'plan_type', 'amount', 'currency', 'status',
            'razorpay_order_id', 'razorpay_payment_id',
            'start_date', 'end_date', 'sessions_included', 'sessions_used',
            'is_active_plan', 'created_at'
        ]
        read_only_fields = ['id', 'mentee', 'created_at']

    def get_is_active_plan(self, obj):
        return obj.is_currently_active()


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = ['id', 'user', 'mentor', 'order_id', 'payment_id', 'amount', 'currency', 'status', 'plan_type', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    mentee_name = serializers.SerializerMethodField()
    mentee_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'session', 'mentee', 'mentee_name', 'mentee_avatar', 'mentor', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'session', 'mentee', 'mentor', 'created_at']

    def get_mentee_name(self, obj):
        return f"{obj.mentee.first_name} {obj.mentee.last_name}".strip() or obj.mentee.username

    def get_mentee_avatar(self, obj):
        if obj.mentee.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.mentee.profile_picture.url)
            return obj.mentee.profile_picture.url
        return None


class LiveSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveSession
        fields = ['id', 'session_request', 'mentee', 'mentor', 'channel_name', 'started_at', 'ended_at', 'is_active', 'agora_token']


class SessionRequestSerializer(serializers.ModelSerializer):
    mentee_details = UserSerializer(source='mentee', read_only=True)
    mentor_details = UserSerializer(source='mentor', read_only=True)
    live_session = LiveSessionSerializer(read_only=True)
    review = ReviewSerializer(read_only=True)

    class Meta:
        model = SessionRequest
        fields = [
            'id', 'mentee', 'mentee_details', 'mentor', 'mentor_details',
            'topic', 'description', 'proposed_date', 'duration_minutes',
            'status', 'is_paid', 'mentor_note', 'created_at', 'updated_at',
            'live_session', 'review'
        ]
        read_only_fields = ['id', 'mentee', 'created_at', 'updated_at', 'live_session', 'review']
