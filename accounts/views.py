from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import User, MentorProfile, MenteeProfile
from .forms import MentorSignupForm, MenteeSignupForm, CustomLoginForm, MentorProfileEditForm, MenteeProfileEditForm


def signup_choice(request):
    return render(request, 'accounts/signup_choice.html')


def mentor_signup(request):
    if request.method == 'POST':
        form = MentorSignupForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'Welcome {user.first_name}! Your mentor account is ready.')
            return redirect('dashboard:mentor_dashboard')
    else:
        form = MentorSignupForm()
    return render(request, 'accounts/mentor_signup.html', {'form': form})


def mentee_signup(request):
    if request.method == 'POST':
        form = MenteeSignupForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'Welcome {user.first_name}! Your mentee account is ready.')
            return redirect('dashboard:mentee_dashboard')
    else:
        form = MenteeSignupForm()
    return render(request, 'accounts/mentee_signup.html', {'form': form})


def user_login(request):
    if request.user.is_authenticated:
        return redirect_by_role(request.user)
    if request.method == 'POST':
        form = CustomLoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            if user.is_suspended:
                messages.error(request, 'Your account has been suspended. Contact admin.')
                return redirect('accounts:login')
            login(request, user)
            messages.success(request, f'Welcome back, {user.first_name}!')
            return redirect_by_role(user)
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = CustomLoginForm()
    return render(request, 'accounts/login.html', {'form': form})


def user_logout(request):
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('accounts:login')


def redirect_by_role(user):
    from django.shortcuts import redirect
    if user.is_superuser or user.role == 'admin':
        return redirect('dashboard:admin_dashboard')
    elif user.role == 'mentor':
        return redirect('dashboard:mentor_dashboard')
    else:
        return redirect('dashboard:mentee_dashboard')


@login_required
def edit_profile(request):
    user = request.user
    if user.role == 'mentor':
        try:
            profile = user.mentor_profile
        except MentorProfile.DoesNotExist:
            profile = MentorProfile.objects.create(user=user, skills='')
        if request.method == 'POST':
            form = MentorProfileEditForm(request.POST, request.FILES, instance=profile, user=user)
            if form.is_valid():
                user.first_name = form.cleaned_data['first_name']
                user.last_name = form.cleaned_data['last_name']
                user.bio = form.cleaned_data.get('bio', '')
                if form.cleaned_data.get('profile_picture'):
                    user.profile_picture = form.cleaned_data['profile_picture']
                user.save()
                form.save()
                messages.success(request, 'Profile updated successfully!')
                return redirect('dashboard:mentor_dashboard')
        else:
            form = MentorProfileEditForm(instance=profile, user=user)
    else:
        try:
            profile = user.mentee_profile
        except MenteeProfile.DoesNotExist:
            profile = MenteeProfile.objects.create(user=user)
        if request.method == 'POST':
            form = MenteeProfileEditForm(request.POST, request.FILES, instance=profile, user=user)
            if form.is_valid():
                user.first_name = form.cleaned_data['first_name']
                user.last_name = form.cleaned_data['last_name']
                user.bio = form.cleaned_data.get('bio', '')
                if form.cleaned_data.get('profile_picture'):
                    user.profile_picture = form.cleaned_data['profile_picture']
                user.save()
                form.save()
                messages.success(request, 'Profile updated successfully!')
                return redirect('dashboard:mentee_dashboard')
        else:
            form = MenteeProfileEditForm(instance=profile, user=user)

    return render(request, 'accounts/edit_profile.html', {'form': form, 'user': user})


def mentor_list(request):
    query = request.GET.get('q', '')
    skill_filter = request.GET.get('skill', '')
    mentors = MentorProfile.objects.filter(user__is_suspended=False).select_related('user')
    if query:
        mentors = mentors.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(user__username__icontains=query) |
            Q(skills__icontains=query)
        )
    if skill_filter:
        mentors = mentors.filter(skills__icontains=skill_filter)
    mentors = mentors.order_by('-average_rating')
    all_skills = set()
    for m in MentorProfile.objects.all():
        for s in m.get_skills_list():
            all_skills.add(s)
    return render(request, 'accounts/mentor_list.html', {
        'mentors': mentors,
        'query': query,
        'skill_filter': skill_filter,
        'all_skills': sorted(all_skills),
    })


def mentor_detail(request, pk):
    mentor_profile = get_object_or_404(MentorProfile, pk=pk)
    from sessions_app.models import Review
    reviews = Review.objects.filter(mentor=mentor_profile.user).order_by('-created_at')
    return render(request, 'accounts/mentor_detail.html', {
        'mentor': mentor_profile,
        'reviews': reviews,
    })
