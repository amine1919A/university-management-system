from django.urls import path
from .views import (
    ExamListCreate, 
    ExamDetail, 
    GradeListCreate, 
    GradeDetail,
    exam_statistics,
    upcoming_exams,
    bulk_create_grades
)

app_name = 'exams'

urlpatterns = [
    # Examens
    path('exams/', ExamListCreate.as_view(), name='exam-list-create'),
    path('exams/<int:pk>/', ExamDetail.as_view(), name='exam-detail'),
    
    # Notes
    path('grades/', GradeListCreate.as_view(), name='grade-list-create'),
    path('grades/<int:pk>/', GradeDetail.as_view(), name='grade-detail'),
    path('grades/bulk/', bulk_create_grades, name='bulk-create-grades'),
    
    # Statistiques et rapports
    path('statistics/', exam_statistics, name='exam-statistics'),
    path('upcoming/', upcoming_exams, name='upcoming-exams'),
]