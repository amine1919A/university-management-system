# backend/students/urls.py - VERSION COMPLÈTE

from django.urls import path
from . import views

urlpatterns = [
    # Endpoints students
    path('', views.student_list, name='student-list'),  
    path('<int:pk>/', views.student_detail, name='student-detail'),
    path('statistics/', views.student_statistics, name='student-statistics'),
    path('export/', views.export_students, name='export-students'),  # Nouvel endpoint
]