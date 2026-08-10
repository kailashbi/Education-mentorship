from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import api_views

app_name = 'accounts_api'

urlpatterns = [
    path('register/mentee/', api_views.RegisterMenteeView.as_view(), name='register_mentee'),
    path('apply/mentor/', api_views.ApplyMentorView.as_view(), name='apply_mentor'),
    path('login/', api_views.LoginAPIView.as_view(), name='login_api'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', api_views.CurrentUserView.as_view(), name='current_user'),
    path('profile/update/', api_views.UpdateProfileView.as_view(), name='update_profile'),
    path('mentors/', api_views.MentorListView.as_view(), name='mentor_list'),
    path('reports/create/', api_views.CreateUserReportView.as_view(), name='create_report'),
    path('notifications/', api_views.UserNotificationsListView.as_view(), name='user_notifications'),
    path('notifications/<int:notification_id>/mark-read/', api_views.MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('notifications/mark-all-read/', api_views.MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
]


