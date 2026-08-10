import uuid
from datetime import timedelta
from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from accounts.models import User, MentorProfile
from .models import SessionRequest, LiveSession, Review, MentorshipSubscription, PaymentTransaction
from .serializers import (
    SessionRequestSerializer, 
    LiveSessionSerializer, 
    ReviewSerializer,
    MentorshipSubscriptionSerializer,
    PaymentTransactionSerializer
)
from .razorpay_service import razorpay_service


class CreateRazorpayOrderView(views.APIView):
    """
    Step 1 of Razorpay Payment:
    Checks if mentee already has active subscription with this mentor.
    Creates Razorpay order for Single Session, 1-Month Plan, or 3-Month Plan.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, mentor_id):
        if request.user.role != 'mentee':
            return Response({'error': 'Only mentees / students can book mentorship sessions.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.is_suspended:
            return Response({'error': 'Your account is suspended by Administrator. Booking mentorship sessions is restricted.'}, status=status.HTTP_403_FORBIDDEN)

        mentor = get_object_or_404(User, pk=mentor_id, role='mentor')

        try:
            mp = mentor.mentor_profile
            if mp.approval_status != 'approved':
                return Response({'error': 'This mentor is not currently accepting students.'}, status=status.HTTP_400_BAD_REQUEST)
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        plan_type = request.data.get('plan_type', 'single')  # 'single', '1_month', '3_months'

        # Check if student is already subscribed to this mentor with active multi-month plan
        active_sub = MentorshipSubscription.objects.filter(
            mentee=request.user,
            mentor=mentor,
            status='active',
            plan_type__in=['1_month', '3_months']
        ).first()

        if active_sub and active_sub.is_currently_active():
            return Response({
                'is_already_subscribed': True,
                'message': f'You are already actively subscribed to {mentor.first_name or mentor.username} on the {active_sub.get_plan_type_display()}!',
                'subscription': MentorshipSubscriptionSerializer(active_sub).data
            })

        # Calculate pricing in INR
        if plan_type == '1_month':
            amount = float(mp.monthly_rate) if mp.monthly_rate > 0 else 1499.00
            plan_name = '1-Month Mentorship Plan'
        elif plan_type == '3_months':
            amount = float(mp.quarterly_rate) if mp.quarterly_rate > 0 else 3999.00
            plan_name = '3-Month Career Transformation Plan'
        else:
            plan_type = 'single'
            amount = float(mp.hourly_rate) if mp.hourly_rate > 0 else 499.00
            plan_name = 'Single 1-on-1 Coaching Session'

        # Generate Razorpay Order
        receipt_id = f"rcpt_{request.user.id}_{mentor.id}_{uuid.uuid4().hex[:6]}"
        order_data = razorpay_service.create_order(
            amount_in_rupees=amount,
            receipt_id=receipt_id,
            notes={
                'mentee_id': request.user.id,
                'mentee_name': request.user.get_full_name() or request.user.username,
                'mentor_id': mentor.id,
                'mentor_name': mentor.get_full_name() or mentor.username,
                'plan_type': plan_type
            }
        )

        # Record Payment Transaction in DB
        PaymentTransaction.objects.create(
            user=request.user,
            mentor=mentor,
            order_id=order_data['id'],
            amount=amount,
            currency='INR',
            status='created',
            plan_type=plan_type
        )

        return Response({
            'order_id': order_data['id'],
            'amount': order_data['amount'],  # in paise
            'amount_in_rupees': amount,
            'currency': order_data['currency'],
            'key_id': order_data['key_id'],
            'plan_type': plan_type,
            'plan_name': plan_name,
            'mentor_name': mentor.get_full_name() or mentor.username,
            'mentee_email': request.user.email,
            'mentee_name': request.user.get_full_name() or request.user.username,
        }, status=status.HTTP_200_OK)


class VerifyPaymentView(views.APIView):
    """
    Step 2 of Razorpay Payment:
    Verifies Razorpay HMAC-SHA256 signature, activates subscription, and creates/confirms session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, mentor_id):
        if request.user.role != 'mentee':
            return Response({'error': 'Only mentees can verify session bookings.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.is_suspended:
            return Response({'error': 'Your account is suspended by Administrator. Booking sessions is restricted.'}, status=status.HTTP_403_FORBIDDEN)

        mentor = get_object_or_404(User, pk=mentor_id, role='mentor')

        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')
        plan_type = request.data.get('plan_type', 'single')
        topic = request.data.get('topic', '1-on-1 Mentorship Session')
        description = request.data.get('description', '')
        proposed_date = request.data.get('proposed_date')
        duration = int(request.data.get('duration_minutes', 60))
        is_already_subscribed = request.data.get('is_already_subscribed', False)

        # If user is already actively subscribed, skip payment verification and book directly
        if is_already_subscribed:
            active_sub = MentorshipSubscription.objects.filter(
                mentee=request.user,
                mentor=mentor,
                status='active'
            ).first()
            if not active_sub or not active_sub.is_currently_active():
                return Response({'error': 'No active subscription found. Please complete checkout.'}, status=status.HTTP_400_BAD_REQUEST)

            active_sub.sessions_used += 1
            active_sub.save()

            if not proposed_date:
                proposed_date = timezone.now() + timedelta(days=1)

            session_req = SessionRequest.objects.create(
                mentee=request.user,
                mentor=mentor,
                subscription=active_sub,
                topic=topic,
                description=description,
                proposed_date=proposed_date,
                duration_minutes=duration,
                status='pending',  # Sent to mentor for acceptance / schedule confirmation
                is_paid=True
            )

            return Response({
                'message': f'Session request sent to {mentor.first_name or mentor.username}! The mentor will accept or confirm your schedule.',
                'session': SessionRequestSerializer(session_req, context={'request': request}).data,
                'subscription': MentorshipSubscriptionSerializer(active_sub).data
            }, status=status.HTTP_201_CREATED)


        # 1. Verify Razorpay Payment Signature
        is_valid = razorpay_service.verify_payment_signature(order_id, payment_id, signature)
        if not is_valid:
            return Response({'error': 'Invalid payment signature. Verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Update Payment Transaction
        payment_tx = PaymentTransaction.objects.filter(order_id=order_id).first()
        if payment_tx:
            payment_tx.payment_id = payment_id or ''
            payment_tx.signature = signature or ''
            payment_tx.status = 'success'
            payment_tx.save()

        # 3. Create / Activate Mentorship Subscription
        now = timezone.now()
        if plan_type == '1_month':
            end_date = now + timedelta(days=30)
            sessions_included = 4
            amount = payment_tx.amount if payment_tx else 1499.00
        elif plan_type == '3_months':
            end_date = now + timedelta(days=90)
            sessions_included = 12
            amount = payment_tx.amount if payment_tx else 3999.00
        else:
            end_date = now + timedelta(days=7)
            sessions_included = 1
            amount = payment_tx.amount if payment_tx else 499.00

        sub = MentorshipSubscription.objects.create(
            mentee=request.user,
            mentor=mentor,
            plan_type=plan_type,
            amount=amount,
            currency='INR',
            status='active',
            razorpay_order_id=order_id or '',
            razorpay_payment_id=payment_id or '',
            razorpay_signature=signature or '',
            start_date=now,
            end_date=end_date,
            sessions_included=sessions_included,
            sessions_used=1  # first session booked with payment
        )

        if payment_tx:
            payment_tx.subscription = sub
            payment_tx.save()

        # 4. Create Confirmed Session Request
        if not proposed_date:
            proposed_date = now + timedelta(days=1)

        session_req = SessionRequest.objects.create(
            mentee=request.user,
            mentor=mentor,
            subscription=sub,
            topic=topic,
            description=description,
            proposed_date=proposed_date,
            duration_minutes=duration,
            status='accepted',  # Paid bookings are confirmed!
            is_paid=True
        )

        # Create LiveSession entry
        channel_name = f"mentorhub_{session_req.id}_{uuid.uuid4().hex[:8]}"
        live_session, _ = LiveSession.objects.get_or_create(
            session_request=session_req,
            defaults={
                'mentee': request.user,
                'mentor': mentor,
                'channel_name': channel_name,
            }
        )

        # Ensure ChatRoom exists and send booking message
        try:
            from chat.models import ChatRoom, Message
            chat_room, _ = ChatRoom.objects.get_or_create(mentor=mentor, mentee=request.user)
            Message.objects.create(
                room=chat_room,
                sender=request.user,
                content=f"🎉 Hi {mentor.first_name or mentor.username}! I just booked the session: '{topic}'. Looking forward to our call!",
                message_type='text'
            )
            chat_room.save()
        except Exception:
            pass

        return Response({
            'message': 'Payment successful! Mentorship plan activated and 1-on-1 session confirmed.',
            'session': SessionRequestSerializer(session_req, context={'request': request}).data,
            'subscription': MentorshipSubscriptionSerializer(sub).data,
            'payment_id': payment_id
        }, status=status.HTTP_201_CREATED)



class CheckMentorSubscriptionView(views.APIView):
    """
    Checks whether the logged-in student has an active subscription with a specific mentor.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, mentor_id):
        if request.user.role != 'mentee':
            return Response({'is_subscribed': False})

        mentor = get_object_or_404(User, pk=mentor_id, role='mentor')
        active_sub = MentorshipSubscription.objects.filter(
            mentee=request.user,
            mentor=mentor,
            status='active'
        ).order_by('-created_at').first()

        if active_sub and active_sub.is_currently_active():
            return Response({
                'is_subscribed': True,
                'subscription': MentorshipSubscriptionSerializer(active_sub).data
            })

        return Response({'is_subscribed': False})


class CreateSessionRequestView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, mentor_id):
        if request.user.role != 'mentee':
            return Response({'error': 'Only mentees can book sessions.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.is_suspended:
            return Response({'error': 'Your account is suspended by Administrator. Requesting mentorship sessions is restricted.'}, status=status.HTTP_403_FORBIDDEN)

        mentor = get_object_or_404(User, pk=mentor_id, role='mentor')
        try:
            if mentor.mentor_profile.approval_status != 'approved':
                return Response({'error': 'This mentor is not currently accepting sessions.'}, status=status.HTTP_400_BAD_REQUEST)
        except MentorProfile.DoesNotExist:
            return Response({'error': 'Mentor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        topic = request.data.get('topic')
        description = request.data.get('description', '')
        proposed_date = request.data.get('proposed_date')
        duration = request.data.get('duration_minutes', 60)

        if not topic or not proposed_date:
            return Response({'error': 'Topic and proposed date/time are required.'}, status=status.HTTP_400_BAD_REQUEST)

        session_req = SessionRequest.objects.create(
            mentee=request.user,
            mentor=mentor,
            topic=topic,
            description=description,
            proposed_date=proposed_date,
            duration_minutes=int(duration),
            status='pending'
        )

        # Ensure ChatRoom exists and send session request message
        try:
            from chat.models import ChatRoom, Message
            chat_room, _ = ChatRoom.objects.get_or_create(mentor=mentor, mentee=request.user)
            Message.objects.create(
                room=chat_room,
                sender=request.user,
                content=f"📅 New Session Request: '{topic}' (Date: {proposed_date}). Looking forward to connecting!",
                message_type='text'
            )
            chat_room.save()
        except Exception:
            pass

        return Response({
            'message': f'Session request sent to {mentor.first_name or mentor.username}!',
            'session': SessionRequestSerializer(session_req, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class MentorSessionRequestsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'mentor':
            return Response({'error': 'Only mentors can view incoming requests.'}, status=status.HTTP_403_FORBIDDEN)

        status_filter = request.GET.get('status')
        requests_qs = SessionRequest.objects.filter(mentor=request.user)

        if status_filter:
            requests_qs = requests_qs.filter(status=status_filter)

        requests_qs = requests_qs.order_by('-created_at')
        serializer = SessionRequestSerializer(requests_qs, many=True, context={'request': request})
        return Response({'requests': serializer.data})


class AcceptSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        if request.user.role != 'mentor' and not request.user.is_superuser:
            return Response({'error': 'Only mentors can accept sessions.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.is_suspended:
            return Response({'error': 'Your mentor account is suspended by Administrator. Accepting sessions is restricted.'}, status=status.HTTP_403_FORBIDDEN)

        session_req = SessionRequest.objects.filter(pk=request_id).first()

        if not session_req:
            return Response({'error': 'Session request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session_req.mentor != request.user and not request.user.is_superuser:
            return Response({'error': 'You can only accept sessions requested with you.'}, status=status.HTTP_403_FORBIDDEN)

        session_req.status = 'accepted'
        session_req.save()

        # Create or fetch live session
        channel_name = f"mentorhub_{session_req.id}_{uuid.uuid4().hex[:8]}"
        live_session, created = LiveSession.objects.get_or_create(
            session_request=session_req,
            defaults={
                'mentee': session_req.mentee,
                'mentor': session_req.mentor,
                'channel_name': channel_name,
                'is_active': True,
                'started_at': timezone.now()
            }
        )
        if not live_session.is_active:
            live_session.is_active = True
            live_session.save()

        # Ensure ChatRoom exists and post acceptance confirmation message
        try:
            from chat.models import ChatRoom, Message
            chat_room, _ = ChatRoom.objects.get_or_create(mentor=request.user, mentee=session_req.mentee)
            Message.objects.create(
                room=chat_room,
                sender=request.user,
                content=f"✅ Session Accepted! I have confirmed your request for '{session_req.topic}'. See you on video call soon!",
                message_type='text'
            )
            chat_room.save()
        except Exception:
            pass

        return Response({
            'message': f'Session accepted for {session_req.mentee.get_full_name() or session_req.mentee.username}!',
            'session': SessionRequestSerializer(session_req, context={'request': request}).data,
            'live_session': LiveSessionSerializer(live_session).data
        })



class RejectSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        if request.user.role != 'mentor' and not request.user.is_superuser:
            return Response({'error': 'Only mentors can reject sessions.'}, status=status.HTTP_403_FORBIDDEN)

        session_req = SessionRequest.objects.filter(pk=request_id).first()
        if not session_req:
            return Response({'error': 'Session request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session_req.mentor != request.user and not request.user.is_superuser:
            return Response({'error': 'You can only reject sessions requested with you.'}, status=status.HTTP_403_FORBIDDEN)

        note = request.data.get('mentor_note', '')
        session_req.status = 'rejected'
        session_req.mentor_note = note
        session_req.save()

        return Response({
            'message': 'Session request rejected.',
            'session': SessionRequestSerializer(session_req, context={'request': request}).data
        })



class JoinLiveSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        # 1. Lookup by LiveSession ID or SessionRequest ID
        live_session = LiveSession.objects.filter(pk=session_id).first()
        if not live_session:
            session_req = get_object_or_404(SessionRequest, pk=session_id)
            channel_name = f"mentorhub_{session_req.id}_{uuid.uuid4().hex[:8]}"
            live_session, _ = LiveSession.objects.get_or_create(
                session_request=session_req,
                defaults={
                    'mentee': session_req.mentee,
                    'mentor': session_req.mentor,
                    'channel_name': channel_name,
                    'is_active': True,
                    'started_at': timezone.now()
                }
            )

        if request.user not in [live_session.mentor, live_session.mentee] and not request.user.is_superuser:
            return Response({'error': 'You do not have access to this video session.'}, status=status.HTTP_403_FORBIDDEN)

        # Mark as active when joined
        if not live_session.is_active and not live_session.ended_at:
            live_session.is_active = True
            live_session.started_at = timezone.now()
            live_session.save()

        from chat.models import ChatRoom
        chat_room, _ = ChatRoom.objects.get_or_create(
            mentor=live_session.mentor,
            mentee=live_session.mentee
        )

        return Response({
            'live_session': LiveSessionSerializer(live_session).data,
            'session_request': SessionRequestSerializer(live_session.session_request, context={'request': request}).data,
            'is_mentor': request.user == live_session.mentor,
            'room_id': live_session.channel_name,
            'chat_room_id': chat_room.id,
        })


class LiveSessionStatusView(views.APIView):
    """
    Lightweight status check polled every 1.5s during video calls
    to instantly detect bilateral call termination.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        live_session = LiveSession.objects.filter(pk=session_id).first()
        if not live_session:
            live_session = LiveSession.objects.filter(session_request_id=session_id).first()
        if not live_session:
            return Response({'is_active': False, 'status': 'completed'})

        if request.user not in [live_session.mentor, live_session.mentee] and not request.user.is_superuser:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'id': live_session.id,
            'is_active': live_session.is_active,
            'status': live_session.session_request.status,
            'ended_at': live_session.ended_at,
            'ended_by': 'peer' if not live_session.is_active else None
        })


class EndLiveSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        live_session = LiveSession.objects.filter(pk=session_id).first()
        if not live_session:
            live_session = LiveSession.objects.filter(session_request_id=session_id).first()
        if not live_session:
            session_req = get_object_or_404(SessionRequest, pk=session_id)
            session_req.status = 'completed'
            session_req.save()
            return Response({'message': 'Session completed.'})

        if request.user not in [live_session.mentor, live_session.mentee] and not request.user.is_superuser:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        live_session.is_active = False
        live_session.ended_at = timezone.now()
        live_session.save()

        req = live_session.session_request
        req.status = 'completed'
        req.save()

        try:
            mp = live_session.mentor.mentor_profile
            mp.total_sessions += 1
            mp.save()
        except Exception:
            pass


# In-memory session signaling buffer for WebRTC P2P cross-browser communication
SESSION_SIGNALS = {}


class LiveSessionSignalView(views.APIView):
    """
    WebRTC Signaling Relay API:
    Allows exchange of SDP offers, answers, ICE candidates, and screen sharing state
    across any browser windows, Incognito sessions, and mobile devices.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        live_session = LiveSession.objects.filter(pk=session_id).first()
        if not live_session:
            live_session = LiveSession.objects.filter(session_request_id=session_id).first()
        if not live_session:
            return Response({'signals': []})

        if request.user not in [live_session.mentor, live_session.mentee] and not request.user.is_superuser:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        key = str(live_session.id)
        signals = SESSION_SIGNALS.get(key, [])
        # Return signals sent by the peer
        peer_signals = [s for s in signals if s.get('sender_id') != request.user.id]
        return Response({
            'signals': peer_signals,
            'is_active': live_session.is_active,
            'peer_id': live_session.mentee.id if request.user == live_session.mentor else live_session.mentor.id
        })

    def post(self, request, session_id):
        live_session = LiveSession.objects.filter(pk=session_id).first()
        if not live_session:
            live_session = LiveSession.objects.filter(session_request_id=session_id).first()
        if not live_session:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [live_session.mentor, live_session.mentee] and not request.user.is_superuser:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        key = str(live_session.id)
        if key not in SESSION_SIGNALS:
            SESSION_SIGNALS[key] = []

        signal_type = request.data.get('type')
        signal_data = request.data.get('data')

        signal_entry = {
            'id': uuid.uuid4().hex[:8],
            'sender_id': request.user.id,
            'sender_name': request.user.get_full_name() or request.user.username,
            'type': signal_type,
            'data': signal_data,
            'timestamp': timezone.now().isoformat()
        }

        # Clean older offers/answers of same type from same sender
        if signal_type in ['offer', 'answer', 'join']:
            SESSION_SIGNALS[key] = [s for s in SESSION_SIGNALS[key] if not (s.get('type') == signal_type and s.get('sender_id') == request.user.id)]

        SESSION_SIGNALS[key].append(signal_entry)

        if len(SESSION_SIGNALS[key]) > 50:
            SESSION_SIGNALS[key] = SESSION_SIGNALS[key][-50:]

        return Response({'status': 'sent', 'signal': signal_entry})

    def delete(self, request, session_id):
        live_session = LiveSession.objects.filter(pk=session_id).first()
        if not live_session:
            live_session = LiveSession.objects.filter(session_request_id=session_id).first()
        if live_session:
            key = str(live_session.id)
            SESSION_SIGNALS.pop(key, None)
        return Response({'message': 'Signaling buffer reset.'})



class SubmitReviewView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        if request.user.role != 'mentee':
            return Response({'error': 'Only mentees can submit reviews.'}, status=status.HTTP_403_FORBIDDEN)

        session_req = get_object_or_404(SessionRequest, pk=session_id, mentee=request.user, status='completed')
        if hasattr(session_req, 'review'):
            return Response({'error': 'You have already reviewed this session.'}, status=status.HTTP_400_BAD_REQUEST)

        rating = int(request.data.get('rating', 5))
        comment = request.data.get('comment', '')

        if rating < 1 or rating > 5:
            return Response({'error': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            session=session_req,
            mentee=request.user,
            mentor=session_req.mentor,
            rating=rating,
            comment=comment,
        )

        try:
            session_req.mentor.mentor_profile.update_rating()
        except Exception:
            pass

        return Response({
            'message': 'Thank you for your review!',
            'review': ReviewSerializer(review, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class MySessionsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'mentee':
            sessions = SessionRequest.objects.filter(mentee=user).order_by('-created_at')
        elif user.role == 'mentor':
            sessions = SessionRequest.objects.filter(mentor=user).order_by('-created_at')
        else:
            sessions = SessionRequest.objects.all().order_by('-created_at')

        serializer = SessionRequestSerializer(sessions, many=True, context={'request': request})
        return Response({'sessions': serializer.data})
