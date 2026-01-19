from django.urls import path
from . import views

app_name = 'grades'

urlpatterns = [
    # Notes
    path('', views.grade_list, name='grade-list'),
    path('<int:pk>/', views.grade_detail, name='grade-detail'),
    path('bulk/', views.bulk_create_grades, name='bulk-create-grades'),
    path('test/', views.test_api, name='test-api'),
    
    # Notes par étudiant
    path('student/<int:student_id>/', views.student_grades, name='student-grades'),
    
    # Notes par cours
    path('course/<int:course_id>/', views.course_grades, name='course-grades'),
    
    # Statistiques
    path('statistics/', views.grade_statistics, name='grade-statistics'),
    path('summary/', views.student_grade_summary, name='student-grade-summary'),
]