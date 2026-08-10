from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import User, MentorProfile, MenteeProfile
from .serializers import (
    UserSerializer,
    MenteeRegisterSerializer,
    MentorApplicationSerializer,
    MentorProfileSerializer,
    MenteeProfileSerializer,
    LoginSerializer
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterMenteeView(views.APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = MenteeRegisterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user, context={'request': request}).data
            return Response({
                'message': 'Mentee account registered successfully!',
                'user': user_data,
                'tokens': tokens,
            }, status=status.HTTP_201_CREATED)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ApplyMentorView(views.APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = MentorApplicationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            profile = user.mentor_profile
            profile_data = MentorProfileSerializer(profile, context={'request': request}).data
            return Response({
                'message': 'Your mentor application and demo video have been submitted! Our admin team will review your profile.',
                'approval_status': profile.approval_status,
                'mentor_profile': profile_data,
            }, status=status.HTTP_201_CREATED)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(username=username, password=password)
        if not user:
            # Check if username is email
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

        if not user:
            return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.is_suspended:
            return Response({
                'error': 'Your account has been suspended by the platform administrator.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check mentor approval status
        if user.role == 'mentor' and not user.is_superuser:
            try:
                mp = user.mentor_profile
                if mp.approval_status == 'pending':
                    return Response({
                        'error': 'Your application is currently pending admin review. You will be able to access the mentor dashboard once approved.',
                        'approval_status': 'pending',
                        'user': UserSerializer(user, context={'request': request}).data
                    }, status=status.HTTP_403_FORBIDDEN)
                elif mp.approval_status == 'rejected':
                    return Response({
                        'error': f'Your mentor application was rejected. Reason: {mp.rejection_reason or "Profile did not meet criteria."}',
                        'approval_status': 'rejected',
                        'rejection_reason': mp.rejection_reason,
                        'user': UserSerializer(user, context={'request': request}).data
                    }, status=status.HTTP_403_FORBIDDEN)
            except MentorProfile.DoesNotExist:
                pass

        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user, context={'request': request}).data

        return Response({
            'message': f'Welcome back, {user.first_name or user.username}!',
            'user': user_data,
            'tokens': tokens,
        }, status=status.HTTP_200_OK)


class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)


class MentorListView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.GET.get('q', '').strip()
        skill_filter = request.GET.get('skill', '').strip()
        min_rating = request.GET.get('min_rating')
        max_rate = request.GET.get('max_rate')
        min_exp = request.GET.get('min_exp')

        # Only return approved and non-suspended mentors
        mentors = MentorProfile.objects.filter(
            approval_status='approved',
            user__is_suspended=False
        ).select_related('user')

        if query:
            mentors = mentors.filter(
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(user__username__icontains=query) |
                Q(user__bio__icontains=query) |
                Q(skills__icontains=query)
            )

        if skill_filter:
            mentors = mentors.filter(skills__icontains=skill_filter)

        if min_rating:
            try:
                mentors = mentors.filter(average_rating__gte=float(min_rating))
            except ValueError:
                pass

        if max_rate:
            try:
                mentors = mentors.filter(hourly_rate__lte=float(max_rate))
            except ValueError:
                pass

        if min_exp:
            try:
                mentors = mentors.filter(experience_years__gte=int(min_exp))
            except ValueError:
                pass

        mentors = mentors.order_by('-average_rating', '-total_sessions')

        serializer = MentorProfileSerializer(mentors, many=True, context={'request': request})
        
        # Collect all unique skills for filter dropdown
        all_skills = set()
        for m in MentorProfile.objects.filter(approval_status='approved'):
            for s in m.get_skills_list():
                all_skills.add(s)

        return Response({
            'mentors': serializer.data,
            'total': mentors.count(),
            'skills': sorted(list(all_skills))
        })


class MentorDetailView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        mentor_profile = get_object_or_404(MentorProfile, pk=pk)
        from sessions_app.serializers import ReviewSerializer
        from sessions_app.models import Review

        reviews = Review.objects.filter(mentor=mentor_profile.user).order_by('-created_at')
        mentor_data = MentorProfileSerializer(mentor_profile, context={'request': request}).data
        reviews_data = ReviewSerializer(reviews, many=True, context={'request': request}).data

        return Response({
            'mentor': mentor_data,
            'reviews': reviews_data,
        })


class UpdateProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        user = request.user
        data = request.data

        # Update basic user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'bio' in data:
            user.bio = data['bio']
        if 'phone' in data:
            user.phone = data['phone']
        if 'profile_picture' in request.FILES:
            user.profile_picture = request.FILES['profile_picture']
        user.save()

        # Update profile specific fields
        if user.role == 'mentor' and hasattr(user, 'mentor_profile'):
            mp = user.mentor_profile
            if 'skills' in data:
                mp.skills = data['skills']
            if 'experience_years' in data:
                mp.experience_years = int(data['experience_years'])
            if 'hourly_rate' in data:
                mp.hourly_rate = float(data['hourly_rate'])
            if 'availability' in data:
                mp.availability = data['availability']
            if 'linkedin_url' in data:
                mp.linkedin_url = data['linkedin_url']
            if 'github_url' in data:
                mp.github_url = data['github_url']
            if 'portfolio_url' in data:
                mp.portfolio_url = data['portfolio_url']
            if 'demo_video' in request.FILES:
                mp.demo_video = request.FILES['demo_video']
            if 'demo_video_url' in data:
                mp.demo_video_url = data['demo_video_url']
            mp.save()

        elif user.role == 'mentee' and hasattr(user, 'mentee_profile'):
            mep = user.mentee_profile
            if 'interests' in data:
                mep.interests = data['interests']
            if 'learning_goals' in data:
                mep.learning_goals = data['learning_goals']
            if 'education' in data:
                mep.education = data['education']
            mep.save()

        return Response({
            'message': 'Profile updated successfully!',
            'user': UserSerializer(user, context={'request': request}).data
        })


class CreateUserReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .models import UserReport
        reported_user_id = request.data.get('reported_user_id')
        category = request.data.get('category', 'chat_abuse')
        description = request.data.get('description', '').strip()
        chat_room_id = request.data.get('chat_room_id')

        if not reported_user_id or not description:
            return Response({'error': 'Reported user ID and description are required.'}, status=status.HTTP_400_BAD_REQUEST)

        reported_user = get_object_or_404(User, pk=reported_user_id)
        if reported_user.id == request.user.id:
            return Response({'error': 'You cannot report your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        chat_room = None
        if chat_room_id:
            from chat.models import ChatRoom
            try:
                chat_room = ChatRoom.objects.get(pk=chat_room_id)
            except ChatRoom.DoesNotExist:
                pass
        
        if not chat_room:
            from chat.models import ChatRoom
            from django.db.models import Q
            chat_room = ChatRoom.objects.filter(
                (Q(mentor=request.user) & Q(mentee=reported_user)) | (Q(mentor=reported_user) & Q(mentee=request.user))
            ).first()

        report = UserReport.objects.create(
            reporter=request.user,
            reported_user=reported_user,
            chat_room=chat_room,
            category=category,
            description=description,
            status='pending'
        )


        from .serializers import UserReportSerializer
        return Response({
            'message': 'Report submitted successfully. Our admin team will inspect the user profile and chat history.',
            'report': UserReportSerializer(report, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class UserNotificationsListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import Notification
        from .serializers import NotificationSerializer
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:30]
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        serializer = NotificationSerializer(notifications, many=True, context={'request': request})
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count,
            'is_suspended': request.user.is_suspended
        })


class MarkNotificationReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):
        from .models import Notification
        from .serializers import NotificationSerializer
        notification = get_object_or_404(Notification, pk=notification_id, recipient=request.user)
        notification.is_read = True
        notification.save()
        return Response({
            'message': 'Notification marked as read.',
            'notification': NotificationSerializer(notification, context={'request': request}).data
        })


class MarkAllNotificationsReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .models import Notification
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'})


