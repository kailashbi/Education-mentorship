from django.urls import path
from . import api_views

app_name = 'chat_api'

urlpatterns = [
    path('rooms/', api_views.ChatRoomListView.as_view(), name='room_list'),
    path('with-user/<int:user_id>/', api_views.GetOrCreateChatRoomView.as_view(), name='with_user'),
    path('room/<int:room_id>/', api_views.ChatRoomDetailView.as_view(), name='room_detail'),
    path('send/<int:room_id>/', api_views.SendMessageView.as_view(), name='send_message'),
    path('poll/<int:room_id>/', api_views.PollMessagesView.as_view(), name='poll_messages'),
    path('export/<int:room_id>/', api_views.ExportChatPDFView.as_view(), name='export_pdf'),
]
