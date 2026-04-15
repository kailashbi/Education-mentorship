from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('', views.chat_list, name='chat_list'),
    path('room/<int:room_id>/', views.chat_room, name='chat_room'),
    path('with/<int:user_id>/', views.chat_room, name='chat_with'),
    path('send/<int:room_id>/', views.send_message, name='send_message'),
    path('messages/<int:room_id>/', views.get_messages, name='get_messages'),
    path('export/<int:room_id>/', views.export_chat_pdf, name='export_pdf'),
]
