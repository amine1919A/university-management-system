from django.urls import path
from . import views

urlpatterns = [
    path('', views.teacher_list, name='teacher-list'),
    path('<int:pk>/', views.teacher_detail, name='teacher-detail'),
    path('statistics/', views.teacher_statistics, name='teacher-statistics'),
]