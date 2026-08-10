import uuid
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from accounts.models import User, MentorProfile
from .models import SessionRequest, LiveSession, Review


@login_required
def request_session(request, mentor_id):
    if request.user.role != 'mentee':
        messages.error(request, 'Only mentees can request sessions.')
        return redirect('dashboard:mentee_dashboard')
    mentor = get_object_or_404(User, pk=mentor_id, role='mentor')
    if request.method == 'POST':
        topic = request.POST.get('topic')
        description = request.POST.get('description', '')
        proposed_date = request.POST.get('proposed_date')
        duration = request.POST.get('duration', 60)
        SessionRequest.objects.create(
            mentee=request.user,
            mentor=mentor,
            topic=topic,
            description=description,
            proposed_date=proposed_date,
            duration_minutes=duration,
        )
        messages.success(request, f'Session request sent to {mentor.first_name}!')
        return redirect('dashboard:mentee_dashboard')
    return render(request, 'sessions/request_session.html', {'mentor': mentor})


@login_required
def mentor_requests(request):
    if request.user.role != 'mentor':
        messages.error(request, 'Access denied.')
        return redirect('dashboard:mentor_dashboard')
    pending = SessionRequest.objects.filter(mentor=request.user, status='pending').order_by('-created_at')
    accepted = SessionRequest.objects.filter(mentor=request.user, status='accepted').order_by('-proposed_date')
    completed = SessionRequest.objects.filter(mentor=request.user, status='completed').order_by('-updated_at')
    return render(request, 'sessions/mentor_requests.html', {
        'pending': pending,
        'accepted': accepted,
        'completed': completed,
    })


@login_required
def accept_request(request, request_id):
    if request.user.role != 'mentor':
        messages.error(request, 'Only mentors can accept requests.')
        return redirect('dashboard:mentor_dashboard')
    session_req = get_object_or_404(SessionRequest, pk=request_id, mentor=request.user)
    session_req.status = 'accepted'
    session_req.save()
    # Create live session
    channel_name = f"session_{uuid.uuid4().hex[:12]}"
    LiveSession.objects.create(
        session_request=session_req,
        mentee=session_req.mentee,
        mentor=request.user,
        channel_name=channel_name,
    )
    messages.success(request, f'Session with {session_req.mentee.first_name} accepted!')
    return redirect('sessions:mentor_requests')


@login_required
def reject_request(request, request_id):
    if request.user.role != 'mentor':
        messages.error(request, 'Only mentors can reject requests.')
        return redirect('dashboard:mentor_dashboard')
    session_req = get_object_or_404(SessionRequest, pk=request_id, mentor=request.user)
    note = request.POST.get('mentor_note', '')
    session_req.status = 'rejected'
    session_req.mentor_note = note
    session_req.save()
    messages.success(request, 'Request rejected.')
    return redirect('sessions:mentor_requests')


@login_required
def start_video_call(request, session_id):
    live_session = get_object_or_404(LiveSession, pk=session_id)
    if request.user not in [live_session.mentor, live_session.mentee]:
        messages.error(request, 'Access denied.')
        return redirect('dashboard:mentor_dashboard')
    if request.user == live_session.mentor:
        live_session.is_active = True
        live_session.started_at = timezone.now()
        live_session.save()
    return render(request, 'sessions/video_call.html', {
        'live_session': live_session,
        'is_mentor': request.user == live_session.mentor,
    })


@login_required
def end_video_call(request, session_id):
    live_session = get_object_or_404(LiveSession, pk=session_id)
    if request.user == live_session.mentor:
        live_session.is_active = False
        live_session.ended_at = timezone.now()
        live_session.save()
        live_session.session_request.status = 'completed'
        live_session.session_request.save()
        try:
            mp = live_session.mentor.mentor_profile
            mp.total_sessions += 1
            mp.save()
        except Exception:
            pass
        messages.success(request, 'Session ended. Mentee can now submit a review.')
    return redirect('sessions:mentor_requests')


@login_required
def submit_review(request, session_id):
    if request.user.role != 'mentee':
        messages.error(request, 'Only mentees can submit reviews.')
        return redirect('dashboard:mentee_dashboard')
    session_req = get_object_or_404(SessionRequest, pk=session_id, mentee=request.user, status='completed')
    if hasattr(session_req, 'review'):
        messages.warning(request, 'You already reviewed this session.')
        return redirect('dashboard:mentee_dashboard')
    if request.method == 'POST':
        rating = int(request.POST.get('rating', 5))
        comment = request.POST.get('comment', '')
        Review.objects.create(
            session=session_req,
            mentee=request.user,
            mentor=session_req.mentor,
            rating=rating,
            comment=comment,
        )
        # Update mentor rating
        try:
            mentor_profile = session_req.mentor.mentor_profile
            mentor_profile.update_rating()
        except Exception:
            pass
        messages.success(request, 'Thank you for your review!')
        return redirect('dashboard:mentee_dashboard')
    return render(request, 'sessions/submit_review.html', {'session': session_req})


@login_required
def my_sessions(request):
    if request.user.role == 'mentee':
        sessions = SessionRequest.objects.filter(mentee=request.user).order_by('-created_at')
    else:
        sessions = SessionRequest.objects.filter(mentor=request.user).order_by('-created_at')
    return render(request, 'sessions/my_sessions.html', {'sessions': sessions})
