from django.urls import path
from . import api_views

app_name = 'sessions_api'

urlpatterns = [
    # Razorpay Payment & Mentorship Subscriptions
    path('payment/create-order/<int:mentor_id>/', api_views.CreateRazorpayOrderView.as_view(), name='create_razorpay_order'),
    path('payment/verify/<int:mentor_id>/', api_views.VerifyPaymentView.as_view(), name='verify_payment'),
    path('payment/check-subscription/<int:mentor_id>/', api_views.CheckMentorSubscriptionView.as_view(), name='check_subscription'),

    # Session Bookings & Management
    path('request/<int:mentor_id>/', api_views.CreateSessionRequestView.as_view(), name='create_request'),
    path('mentor-requests/', api_views.MentorSessionRequestsView.as_view(), name='mentor_requests'),
    path('accept/<int:request_id>/', api_views.AcceptSessionView.as_view(), name='accept_request'),
    path('reject/<int:request_id>/', api_views.RejectSessionView.as_view(), name='reject_request'),
    path('live/<int:session_id>/', api_views.JoinLiveSessionView.as_view(), name='join_live'),
    path('live/<int:session_id>/signal/', api_views.LiveSessionSignalView.as_view(), name='live_signal'),
    path('live/<int:session_id>/status/', api_views.LiveSessionStatusView.as_view(), name='live_status'),
    path('live/<int:session_id>/end/', api_views.EndLiveSessionView.as_view(), name='end_live'),

    path('review/<int:session_id>/', api_views.SubmitReviewView.as_view(), name='submit_review'),
    path('my-sessions/', api_views.MySessionsView.as_view(), name='my_sessions'),
]
