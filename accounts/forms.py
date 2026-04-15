from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User, MentorProfile, MenteeProfile


class MentorSignupForm(UserCreationForm):
    first_name = forms.CharField(max_length=50, required=True)
    last_name = forms.CharField(max_length=50, required=True)
    email = forms.EmailField(required=True)
    bio = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False)
    skills = forms.CharField(help_text="Comma-separated (e.g. Python, Django, React)")
    experience_years = forms.IntegerField(min_value=0, initial=0)
    hourly_rate = forms.DecimalField(min_value=0, decimal_places=2, initial=0)
    availability = forms.CharField(max_length=200, required=False)
    linkedin_url = forms.URLField(required=False)
    github_url = forms.URLField(required=False)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password1', 'password2',
                  'bio', 'profile_picture']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = 'mentor'
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.email = self.cleaned_data['email']
        user.bio = self.cleaned_data.get('bio', '')
        if commit:
            user.save()
            MentorProfile.objects.create(
                user=user,
                skills=self.cleaned_data['skills'],
                experience_years=self.cleaned_data['experience_years'],
                hourly_rate=self.cleaned_data['hourly_rate'],
                availability=self.cleaned_data.get('availability', ''),
                linkedin_url=self.cleaned_data.get('linkedin_url', ''),
                github_url=self.cleaned_data.get('github_url', ''),
            )
        return user


class MenteeSignupForm(UserCreationForm):
    first_name = forms.CharField(max_length=50, required=True)
    last_name = forms.CharField(max_length=50, required=True)
    email = forms.EmailField(required=True)
    bio = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False)
    interests = forms.CharField(required=False, help_text="Comma-separated interests")
    learning_goals = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False)
    education = forms.CharField(max_length=200, required=False)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password1', 'password2',
                  'bio', 'profile_picture']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = 'mentee'
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.email = self.cleaned_data['email']
        user.bio = self.cleaned_data.get('bio', '')
        if commit:
            user.save()
            MenteeProfile.objects.create(
                user=user,
                interests=self.cleaned_data.get('interests', ''),
                learning_goals=self.cleaned_data.get('learning_goals', ''),
                education=self.cleaned_data.get('education', ''),
            )
        return user


class CustomLoginForm(AuthenticationForm):
    pass


class MentorProfileEditForm(forms.ModelForm):
    first_name = forms.CharField(max_length=50)
    last_name = forms.CharField(max_length=50)
    bio = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False)
    profile_picture = forms.ImageField(required=False)

    class Meta:
        model = MentorProfile
        fields = ['skills', 'experience_years', 'hourly_rate', 'availability',
                  'linkedin_url', 'github_url']

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['bio'].initial = user.bio


class MenteeProfileEditForm(forms.ModelForm):
    first_name = forms.CharField(max_length=50)
    last_name = forms.CharField(max_length=50)
    bio = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False)
    profile_picture = forms.ImageField(required=False)

    class Meta:
        model = MenteeProfile
        fields = ['interests', 'learning_goals', 'education']

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['bio'].initial = user.bio
