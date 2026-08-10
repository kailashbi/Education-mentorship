from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, MentorProfile, MenteeProfile


class MenteeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenteeProfile
        fields = ['id', 'interests', 'learning_goals', 'education']


class MentorProfileSerializer(serializers.ModelSerializer):
    skills_list = serializers.SerializerMethodField()
    demo_video_file_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    bio = serializers.CharField(source='user.bio', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = MentorProfile
        fields = [
            'id', 'user', 'username', 'first_name', 'last_name', 'email', 'bio', 'phone',
            'skills', 'skills_list', 'experience_years', 'hourly_rate', 'monthly_rate', 'quarterly_rate', 'availability',
            'linkedin_url', 'github_url', 'portfolio_url',
            'demo_video', 'demo_video_file_url', 'demo_video_url',
            'approval_status', 'rejection_reason', 'applied_at', 'reviewed_at',
            'total_sessions', 'average_rating', 'total_reviews', 'profile_picture_url'
        ]
        read_only_fields = ['approval_status', 'rejection_reason', 'applied_at', 'reviewed_at', 'total_sessions', 'average_rating', 'total_reviews']

    def get_skills_list(self, obj):
        return obj.get_skills_list()

    def get_demo_video_file_url(self, obj):
        if obj.demo_video:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.demo_video.url)
            return obj.demo_video.url
        return None

    def get_profile_picture_url(self, obj):
        if obj.user.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_picture.url)
            return obj.user.profile_picture.url
        return None


class UserSerializer(serializers.ModelSerializer):
    mentor_profile = serializers.SerializerMethodField()
    mentee_profile = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'bio', 'phone', 'profile_picture', 'profile_picture_url',
            'is_verified', 'is_suspended', 'created_at',
            'mentor_profile', 'mentee_profile'
        ]
        read_only_fields = ['is_verified', 'is_suspended', 'created_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_mentor_profile(self, obj):
        if obj.role == 'mentor' and hasattr(obj, 'mentor_profile'):
            return MentorProfileSerializer(obj.mentor_profile, context=self.context).data
        return None

    def get_mentee_profile(self, obj):
        if obj.role == 'mentee' and hasattr(obj, 'mentee_profile'):
            return MenteeProfileSerializer(obj.mentee_profile, context=self.context).data
        return None

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class MenteeRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    interests = serializers.CharField(required=False, allow_blank=True)
    learning_goals = serializers.CharField(required=False, allow_blank=True)
    education = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'bio', 'phone', 'profile_picture',
            'interests', 'learning_goals', 'education'
        ]

    def create(self, validated_data):
        interests = validated_data.pop('interests', '')
        learning_goals = validated_data.pop('learning_goals', '')
        education = validated_data.pop('education', '')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            role='mentee',
            is_verified=True,  # Mentees can immediately log in
            **validated_data
        )
        user.set_password(password)
        user.save()

        MenteeProfile.objects.create(
            user=user,
            interests=interests,
            learning_goals=learning_goals,
            education=education
        )
        return user


class MentorApplicationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    skills = serializers.CharField(required=True)
    experience_years = serializers.IntegerField(required=False, default=0)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=0.0)
    availability = serializers.CharField(required=False, allow_blank=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)
    github_url = serializers.URLField(required=False, allow_blank=True)
    portfolio_url = serializers.URLField(required=False, allow_blank=True)
    demo_video = serializers.FileField(required=False, allow_null=True)
    demo_video_url = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'bio', 'phone', 'profile_picture',
            'skills', 'experience_years', 'hourly_rate', 'availability',
            'linkedin_url', 'github_url', 'portfolio_url',
            'demo_video', 'demo_video_url'
        ]

    def create(self, validated_data):
        skills = validated_data.pop('skills')
        experience_years = validated_data.pop('experience_years', 0)
        hourly_rate = validated_data.pop('hourly_rate', 0.0)
        availability = validated_data.pop('availability', '')
        linkedin_url = validated_data.pop('linkedin_url', '')
        github_url = validated_data.pop('github_url', '')
        portfolio_url = validated_data.pop('portfolio_url', '')
        demo_video = validated_data.pop('demo_video', None)
        demo_video_url = validated_data.pop('demo_video_url', '')
        password = validated_data.pop('password')

        # Create mentor with is_verified=False, pending approval
        user = User.objects.create_user(
            role='mentor',
            is_verified=False,
            **validated_data
        )
        user.set_password(password)
        user.save()

        MentorProfile.objects.create(
            user=user,
            skills=skills,
            experience_years=experience_years,
            hourly_rate=hourly_rate,
            availability=availability,
            linkedin_url=linkedin_url,
            github_url=github_url,
            portfolio_url=portfolio_url,
            demo_video=demo_video,
            demo_video_url=demo_video_url,
            approval_status='pending',
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class UserReportSerializer(serializers.ModelSerializer):
    reporter_details = UserSerializer(source='reporter', read_only=True)
    reported_user_details = UserSerializer(source='reported_user', read_only=True)

    class Meta:
        from .models import UserReport
        model = UserReport
        fields = [
            'id', 'reporter', 'reporter_details', 'reported_user', 'reported_user_details',
            'chat_room', 'category', 'description', 'status',
            'admin_notes', 'action_taken', 'resolved_by',
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'reporter', 'status', 'admin_notes', 'action_taken', 'resolved_by', 'created_at', 'resolved_at']


class NotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()

    class Meta:
        from .models import Notification
        model = Notification
        fields = ['id', 'recipient', 'title', 'message', 'notification_type', 'is_read', 'link', 'created_at', 'time_ago']
        read_only_fields = ['id', 'recipient', 'created_at']

    def get_time_ago(self, obj):
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        seconds = diff.total_seconds()
        if seconds < 60:
            return 'Just now'
        elif seconds < 3600:
            return f"{int(seconds // 60)}m ago"
        elif seconds < 86400:
            return f"{int(seconds // 3600)}h ago"
        return obj.created_at.strftime('%d %b, %H:%M')


