from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q, Avg, Sum

from accounts.models import User, MentorProfile, MenteeProfile
from accounts.permissions import IsAdminRole, IsApprovedMentor
from accounts.serializers import UserSerializer, MentorProfileSerializer
from sessions_app.models import SessionRequest, LiveSession, Review, MentorshipSubscription
from sessions_app.serializers import SessionRequestSerializer, ReviewSerializer, MentorshipSubscriptionSerializer



class AdminDashboardStatsView(views.APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        from accounts.models import UserReport
        total_mentors = MentorProfile.objects.filter(approval_status='approved').count()
        pending_mentors = MentorProfile.objects.filter(approval_status='pending').count()
        rejected_mentors = MentorProfile.objects.filter(approval_status='rejected').count()
        total_mentees = User.objects.filter(role='mentee').count()
        total_sessions = SessionRequest.objects.count()
        completed_sessions = SessionRequest.objects.filter(status='completed').count()
        pending_sessions = SessionRequest.objects.filter(status='pending').count()
        active_live_sessions = LiveSession.objects.filter(is_active=True).count()
        suspended_users = User.objects.filter(is_suspended=True).count()
        total_reviews = Review.objects.count()
        pending_reports = UserReport.objects.filter(status='pending').count()

        # Recent activities
        recent_applications = MentorProfile.objects.filter(approval_status='pending').order_by('-applied_at')[:5]
        recent_sessions = SessionRequest.objects.order_by('-created_at')[:8]

        return Response({
            'stats': {
                'total_mentors': total_mentors,
                'pending_mentors': pending_mentors,
                'rejected_mentors': rejected_mentors,
                'total_mentees': total_mentees,
                'total_sessions': total_sessions,
                'completed_sessions': completed_sessions,
                'pending_sessions': pending_sessions,
                'active_live_sessions': active_live_sessions,
                'suspended_users': suspended_users,
                'total_reviews': total_reviews,
                'pending_reports': pending_reports,
            },
            'recent_applications': MentorProfileSerializer(recent_applications, many=True, context={'request': request}).data,
            'recent_sessions': SessionRequestSerializer(recent_sessions, many=True, context={'request': request}).data
        })


class AdminReportsListView(views.APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        from accounts.models import UserReport
        from accounts.serializers import UserReportSerializer
        status_filter = request.GET.get('status')
        reports_qs = UserReport.objects.all().order_by('-created_at')

        if status_filter and status_filter != 'all':
            reports_qs = reports_qs.filter(status=status_filter)

        serializer = UserReportSerializer(reports_qs, many=True, context={'request': request})
        return Response({
            'reports': serializer.data,
            'count': reports_qs.count()
        })


class AdminReportActionView(views.APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, report_id):
        from accounts.models import UserReport
        from accounts.serializers import UserReportSerializer
        report = get_object_or_404(UserReport, pk=report_id)
        
        action = request.data.get('action') # 'suspend', 'unsuspend', 'warn', 'dismiss'
        admin_notes = request.data.get('admin_notes', '')

        from accounts.models import Notification

        if action == 'suspend':
            report.reported_user.is_suspended = True
            report.reported_user.save()
            report.status = 'resolved'
            report.action_taken = 'Account Blocked / Suspended'
            Notification.objects.create(
                recipient=report.reported_user,
                title='🚫 Account Suspended by Admin',
                message=admin_notes or 'Your account privileges have been restricted due to a policy violation. Chatting and booking are temporarily disabled.',
                notification_type='suspension',
                link='/chat'
            )
        elif action == 'unsuspend':
            report.reported_user.is_suspended = False
            report.reported_user.save()
            report.status = 'resolved'
            report.action_taken = 'Account Unblocked'
            Notification.objects.create(
                recipient=report.reported_user,
                title='✅ Account Suspension Lifted',
                message=admin_notes or 'Your account suspension has been reviewed and lifted by the administrator. Full access has been restored.',
                notification_type='info',
                link='/chat'
            )
        elif action == 'warn':
            report.status = 'resolved'
            report.action_taken = 'Official Warning Issued'
            Notification.objects.create(
                recipient=report.reported_user,
                title='⚠️ Official Admin Warning Issued',
                message=admin_notes or f'An official warning has been issued by MentorHub Admin regarding your recent chat activity: {report.description}',
                notification_type='warning',
                link='/chat'
            )
        elif action == 'dismiss':
            report.status = 'dismissed'
            report.action_taken = 'Dismissed (No Violation Found)'

        report.admin_notes = admin_notes
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()


        return Response({
            'message': f'Report #{report.id} updated: {report.action_taken}',
            'report': UserReportSerializer(report, context={'request': request}).data
        })


class AdminInspectChatView(views.APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        from chat.models import ChatRoom, Message
        from chat.serializers import ChatRoomSerializer, MessageSerializer
        from accounts.models import UserReport

        report_id = request.GET.get('report_id')
        room_id = request.GET.get('room_id')
        user1_id = request.GET.get('user1_id')
        user2_id = request.GET.get('user2_id')

        room = None
        report = None

        if report_id:
            try:
                report = UserReport.objects.get(pk=report_id)
                if report.chat_room:
                    room = report.chat_room
                else:
                    u1 = report.reporter
                    u2 = report.reported_user
                    room = ChatRoom.objects.filter(
                        (Q(mentor=u1) & Q(mentee=u2)) | (Q(mentor=u2) & Q(mentee=u1))
                    ).first()
            except UserReport.DoesNotExist:
                pass

        if not room and room_id:
            try:
                room = ChatRoom.objects.get(pk=room_id)
            except ChatRoom.DoesNotExist:
                pass

        if not room and user1_id and user2_id:
            try:
                u1 = User.objects.get(pk=user1_id)
                u2 = User.objects.get(pk=user2_id)
                room = ChatRoom.objects.filter(
                    (Q(mentor=u1) & Q(mentee=u2)) | (Q(mentor=u2) & Q(mentee=u1))
                ).first()
            except User.DoesNotExist:
                pass

        # If a direct room is found, return its messages
        if room:
            messages = room.messages.order_by('created_at')
            return Response({
                'room': ChatRoomSerializer(room, context={'request': request}).data,
                'messages': MessageSerializer(messages, many=True, context={'request': request}).data,
                'total_messages': messages.count(),
                'found_direct_room': True
            })

        # Fallback: if inspecting a report or user and no single room exists, fetch all messages sent/received by the reported user
        target_user = None
        if report:
            target_user = report.reported_user
        elif user1_id:
            target_user = User.objects.filter(pk=user1_id).first()

        if target_user:
            user_messages = Message.objects.filter(
                Q(sender=target_user) | Q(room__mentor=target_user) | Q(room__mentee=target_user)
            ).order_by('created_at')[:50]

            return Response({
                'room': None,
                'messages': MessageSerializer(user_messages, many=True, context={'request': request}).data,
                'total_messages': user_messages.count(),
                'found_direct_room': False,
                'note': f'Showing all recent activity messages for user {target_user.username}'
            })

        return Response({
            'room': None,
            'messages': [],
            'total_messages': 0,
            'found_direct_room': False,
            'note': 'No chat conversation found.'
        })


class AdminAllChatsListView(views.APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        from chat.models import ChatRoom
        from chat.serializers import ChatRoomSerializer

        rooms = ChatRoom.objects.all().order_by('-last_message_at')
        serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
        return Response({
            'rooms': serializer.data,
            'total_rooms': rooms.count()
        })




class PendingMentorApplicationsView(views.APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        status_filter = request.GET.get('status', 'pending')
        if status_filter == 'all':
            profiles = MentorProfile.objects.all().order_by('-applied_at')
        else:
            profiles = MentorProfile.objects.filter(approval_status=status_filter).order_by('-applied_at')

        serializer = MentorProfileSerializer(profiles, many=True, context={'request': request})
        return Response({
            'applications': serializer.data,
            'count': profiles.count()
        })


class ApproveMentorView(views.APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, mentor_id):
        profile = MentorProfile.objects.filter(pk=mentor_id).first()
        if not profile:
            profile = MentorProfile.objects.filter(user_id=mentor_id).first()
        if not profile:
            return Response({'error': 'Mentor application not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile.approval_status = 'approved'
        profile.reviewed_at = timezone.now()
        profile.reviewed_by = request.user
        profile.rejection_reason = ''
        profile.save()

        # Mark user as verified
        user = profile.user
        user.is_verified = True
        user.save()

        from accounts.models import Notification
        Notification.objects.create(
            recipient=user,
            title='🎉 Mentor Profile Approved!',
            message='Congratulations! Your application has been approved by the admin team. You are now live on MentorHub directory and can accept mentorship bookings.',
            notification_type='approval',
            link='/mentor/dashboard'
        )

        return Response({
            'message': f'Mentor {user.get_full_name() or user.username} has been approved successfully!',
            'mentor': MentorProfileSerializer(profile, context={'request': request}).data
        })


class RejectMentorView(views.APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, mentor_id):
        profile = MentorProfile.objects.filter(pk=mentor_id).first()
        if not profile:
            profile = MentorProfile.objects.filter(user_id=mentor_id).first()
        if not profile:
            return Response({'error': 'Mentor application not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Application did not meet platform criteria.')

        profile.approval_status = 'rejected'
        profile.rejection_reason = reason
        profile.reviewed_at = timezone.now()
        profile.reviewed_by = request.user
        profile.save()

        user = profile.user
        user.is_verified = False
        user.save()

        from accounts.models import Notification
        Notification.objects.create(
            recipient=user,
            title='Mentor Application Update',
            message=f'Your mentor application was reviewed and not approved at this time. Reason: {reason}',
            notification_type='rejection',
            link='/mentor/apply'
        )

        return Response({
            'message': f'Mentor application for {user.get_full_name() or user.username} has been rejected.',
            'mentor': MentorProfileSerializer(profile, context={'request': request}).data
        })




class AdminUserManagementView(views.APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        role_filter = request.GET.get('role')
        query = request.GET.get('q', '').strip()
        suspended_only = request.GET.get('suspended') == 'true'

        users = User.objects.all().order_by('-date_joined')

        if role_filter:
            users = users.filter(role=role_filter)
        if suspended_only:
            users = users.filter(is_suspended=True)
        if query:
            users = users.filter(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query)
            )

        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response({
            'users': serializer.data,
            'count': users.count()
        })


class ToggleUserSuspensionView(views.APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        if user.is_superuser:
            return Response({'error': 'Cannot suspend a superuser.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_suspended = not user.is_suspended
        user.save()

        status_str = 'suspended' if user.is_suspended else 're-activated'
        return Response({
            'message': f'User {user.username} has been {status_str}.',
            'user': UserSerializer(user, context={'request': request}).data
        })


class AdminDeleteUserView(views.APIView):
    permission_classes = [IsAdminRole]

    def delete(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        if user.is_superuser:
            return Response({'error': 'Cannot delete a superuser.'}, status=status.HTTP_400_BAD_REQUEST)

        username = user.username
        user.delete()
        return Response({'message': f'User {username} deleted permanently.'})


class MentorDashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'mentor':
            return Response({'error': 'Mentor access only.'}, status=status.HTTP_403_FORBIDDEN)

        pending_requests = SessionRequest.objects.filter(mentor=user, status='pending').order_by('-created_at')
        upcoming_sessions = SessionRequest.objects.filter(mentor=user, status='accepted').order_by('proposed_date')
        active_live_sessions = LiveSession.objects.filter(mentor=user, is_active=True)
        completed_sessions = SessionRequest.objects.filter(mentor=user, status='completed').count()
        reviews = Review.objects.filter(mentor=user).order_by('-created_at')[:6]

        try:
            profile = user.mentor_profile
            profile_data = MentorProfileSerializer(profile, context={'request': request}).data
            est_earnings = float(profile.hourly_rate) * completed_sessions
        except Exception:
            profile_data = None
            est_earnings = 0.0

        active_subscriptions = MentorshipSubscription.objects.filter(
            mentor=user,
            status='active'
        ).select_related('mentee')

        return Response({
            'profile': profile_data,
            'stats': {
                'pending_requests_count': pending_requests.count(),
                'upcoming_sessions_count': upcoming_sessions.count(),
                'completed_sessions_count': completed_sessions,
                'active_live_sessions_count': active_live_sessions.count(),
                'estimated_earnings': est_earnings,
                'average_rating': profile.average_rating if profile_data else 0.0,
                'total_reviews': profile.total_reviews if profile_data else 0,
            },
            'pending_requests': SessionRequestSerializer(pending_requests[:10], many=True, context={'request': request}).data,
            'upcoming_sessions': SessionRequestSerializer(upcoming_sessions[:10], many=True, context={'request': request}).data,
            'active_subscribers': MentorshipSubscriptionSerializer(active_subscriptions, many=True, context={'request': request}).data,
            'active_live_sessions': [
                {
                    'id': ls.id,
                    'channel_name': ls.channel_name,
                    'mentee_name': ls.mentee.get_full_name() or ls.mentee.username,
                    'topic': ls.session_request.topic,
                    'session_id': ls.session_request.id
                } for ls in active_live_sessions
            ],
            'recent_reviews': ReviewSerializer(reviews, many=True, context={'request': request}).data
        })


class MenteeDashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'mentee':
            return Response({'error': 'Mentee access only.'}, status=status.HTTP_403_FORBIDDEN)

        my_sessions = SessionRequest.objects.filter(mentee=user).order_by('-created_at')
        upcoming = SessionRequest.objects.filter(mentee=user, status='accepted').order_by('proposed_date')
        pending = SessionRequest.objects.filter(mentee=user, status='pending').order_by('-created_at')
        completed = SessionRequest.objects.filter(mentee=user, status='completed').order_by('-updated_at')
        active_live_sessions = LiveSession.objects.filter(mentee=user, is_active=True)

        active_subscriptions = MentorshipSubscription.objects.filter(
            mentee=user,
            status='active'
        ).select_related('mentor')

        # Unreviewed completed sessions
        unreviewed = SessionRequest.objects.filter(mentee=user, status='completed', review__isnull=True)

        # Top rated approved mentors recommendation
        top_mentors = MentorProfile.objects.filter(
            approval_status='approved',
            user__is_suspended=False
        ).order_by('-average_rating', '-total_sessions')[:4]

        return Response({
            'stats': {
                'total_sessions': my_sessions.count(),
                'upcoming_count': upcoming.count(),
                'pending_count': pending.count(),
                'completed_count': completed.count(),
                'active_live_sessions_count': active_live_sessions.count(),
                'pending_reviews_count': unreviewed.count(),
            },
            'upcoming_sessions': SessionRequestSerializer(upcoming[:10], many=True, context={'request': request}).data,
            'recent_sessions': SessionRequestSerializer(my_sessions[:15], many=True, context={'request': request}).data,
            'active_subscriptions': MentorshipSubscriptionSerializer(active_subscriptions, many=True, context={'request': request}).data,
            'unreviewed_sessions': SessionRequestSerializer(unreviewed, many=True, context={'request': request}).data,
            'active_live_sessions': [
                {
                    'id': ls.id,
                    'channel_name': ls.channel_name,
                    'mentor_name': ls.mentor.get_full_name() or ls.mentor.username,
                    'topic': ls.session_request.topic,
                    'session_id': ls.session_request.id
                } for ls in active_live_sessions
            ],
            'recommended_mentors': MentorProfileSerializer(top_mentors, many=True, context={'request': request}).data
        })

