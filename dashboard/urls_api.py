from django.urls import path
from . import api_views

app_name = 'dashboard_api'

urlpatterns = [
    # Admin stats & approval hub
    path('admin/stats/', api_views.AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('admin/applications/', api_views.PendingMentorApplicationsView.as_view(), name='pending_applications'),
    path('admin/approve/<int:mentor_id>/', api_views.ApproveMentorView.as_view(), name='approve_mentor'),
    path('admin/reject/<int:mentor_id>/', api_views.RejectMentorView.as_view(), name='reject_mentor'),
    path('admin/users/', api_views.AdminUserManagementView.as_view(), name='admin_users'),
    path('admin/users/<int:user_id>/suspend/', api_views.ToggleUserSuspensionView.as_view(), name='toggle_suspend_user'),
    path('admin/reports/', api_views.AdminReportsListView.as_view(), name='admin_reports'),
    path('admin/reports/<int:report_id>/action/', api_views.AdminReportActionView.as_view(), name='admin_report_action'),
    path('admin/inspect-chat/', api_views.AdminInspectChatView.as_view(), name='admin_inspect_chat'),
    path('admin/all-chats/', api_views.AdminAllChatsListView.as_view(), name='admin_all_chats'),

    # Role dashboards

    path('mentor/stats/', api_views.MentorDashboardStatsView.as_view(), name='mentor_stats'),
    path('mentee/stats/', api_views.MenteeDashboardStatsView.as_view(), name='mentee_stats'),
]

