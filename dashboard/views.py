from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from accounts.models import User, MentorProfile
from sessions_app.models import SessionRequest, LiveSession, Review


@login_required
def mentor_dashboard(request):
    if request.user.role not in ['mentor']:
        return redirect('dashboard:mentee_dashboard')
    user = request.user
    pending_count = SessionRequest.objects.filter(mentor=user, status='pending').count()
    upcoming = SessionRequest.objects.filter(mentor=user, status='accepted').order_by('proposed_date')[:5]
    recent_reviews = Review.objects.filter(mentor=user).order_by('-created_at')[:5]
    total_sessions = SessionRequest.objects.filter(mentor=user, status='completed').count()
    active_sessions = LiveSession.objects.filter(mentor=user, is_active=True)
    try:
        mentor_profile = user.mentor_profile
    except Exception:
        mentor_profile = None
    return render(request, 'dashboard/mentor_dashboard.html', {
        'pending_count': pending_count,
        'upcoming': upcoming,
        'recent_reviews': recent_reviews,
        'total_sessions': total_sessions,
        'active_sessions': active_sessions,
        'mentor_profile': mentor_profile,
    })


@login_required
def mentee_dashboard(request):
    if request.user.role not in ['mentee']:
        return redirect('dashboard:mentor_dashboard')
    user = request.user
    my_sessions = SessionRequest.objects.filter(mentee=user).order_by('-created_at')[:10]
    pending_reviews = SessionRequest.objects.filter(
        mentee=user, status='completed'
    ).exclude(review__isnull=False).count()
    active_sessions = LiveSession.objects.filter(mentee=user, is_active=True)
    return render(request, 'dashboard/mentee_dashboard.html', {
        'my_sessions': my_sessions,
        'pending_reviews': pending_reviews,
        'active_sessions': active_sessions,
    })


@login_required
def admin_dashboard(request):
    if not (request.user.is_superuser or request.user.role == 'admin'):
        messages.error(request, 'Admin access required.')
        return redirect('accounts:login')
    total_mentors = User.objects.filter(role='mentor').count()
    total_mentees = User.objects.filter(role='mentee').count()
    total_sessions = SessionRequest.objects.filter(status='completed').count()
    pending_sessions = SessionRequest.objects.filter(status='pending').count()
    suspended_users = User.objects.filter(is_suspended=True)
    recent_users = User.objects.order_by('-date_joined')[:10]
    all_mentors = User.objects.filter(role='mentor').order_by('-date_joined')
    all_mentees = User.objects.filter(role='mentee').order_by('-date_joined')
    all_sessions = SessionRequest.objects.order_by('-created_at')[:20]
    return render(request, 'dashboard/admin_dashboard.html', {
        'total_mentors': total_mentors,
        'total_mentees': total_mentees,
        'total_sessions': total_sessions,
        'pending_sessions': pending_sessions,
        'suspended_users': suspended_users,
        'recent_users': recent_users,
        'all_mentors': all_mentors,
        'all_mentees': all_mentees,
        'all_sessions': all_sessions,
    })


@login_required
def suspend_user(request, user_id):
    if not (request.user.is_superuser or request.user.role == 'admin'):
        messages.error(request, 'Admin access required.')
        return redirect('accounts:login')
    target = get_object_or_404(User, pk=user_id)
    target.is_suspended = not target.is_suspended
    target.save()
    action = 'suspended' if target.is_suspended else 'unsuspended'
    messages.success(request, f'User {target.username} has been {action}.')
    return redirect('dashboard:admin_dashboard')


@login_required
def delete_user(request, user_id):
    if not (request.user.is_superuser or request.user.role == 'admin'):
        messages.error(request, 'Admin access required.')
        return redirect('accounts:login')
    target = get_object_or_404(User, pk=user_id)
    username = target.username
    target.delete()
    messages.success(request, f'User {username} deleted.')
    return redirect('dashboard:admin_dashboard')
