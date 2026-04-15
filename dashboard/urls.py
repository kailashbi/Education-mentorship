from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.mentee_dashboard, name='home'),
    path('mentor/', views.mentor_dashboard, name='mentor_dashboard'),
    path('mentee/', views.mentee_dashboard, name='mentee_dashboard'),
    path('admin/', views.admin_dashboard, name='admin_dashboard'),
    path('admin/suspend/<int:user_id>/', views.suspend_user, name='suspend_user'),
    path('admin/delete/<int:user_id>/', views.delete_user, name='delete_user'),
]
