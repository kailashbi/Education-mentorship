from django.urls import path
from . import views

app_name = 'sessions'

urlpatterns = [
    path('request/<int:mentor_id>/', views.request_session, name='request_session'),
    path('requests/', views.mentor_requests, name='mentor_requests'),
    path('accept/<int:request_id>/', views.accept_request, name='accept_request'),
    path('reject/<int:request_id>/', views.reject_request, name='reject_request'),
    path('video/<int:session_id>/', views.start_video_call, name='video_call'),
    path('video/<int:session_id>/end/', views.end_video_call, name='end_call'),
    path('review/<int:session_id>/', views.submit_review, name='submit_review'),
    path('my/', views.my_sessions, name='my_sessions'),
]
