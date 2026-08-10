from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('signup/', views.signup_choice, name='signup_choice'),
    path('signup/mentor/', views.mentor_signup, name='mentor_signup'),
    path('signup/mentee/', views.mentee_signup, name='mentee_signup'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('mentors/', views.mentor_list, name='mentor_list'),
    path('mentors/<int:pk>/', views.mentor_detail, name='mentor_detail'),
]
