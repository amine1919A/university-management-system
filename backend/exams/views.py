from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Avg, Q
from datetime import date, datetime
from .models import Exam, Grade
from .serializers import ExamSerializer, GradeSerializer, ExamDetailSerializer

class ExamListCreate(generics.ListCreateAPIView):
    """Liste et création d'examens"""
    queryset = Exam.objects.select_related('course').all()
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'exam_type', 'status', 'date']
    search_fields = ['title', 'description', 'location', 'course__title', 'course__course_code']
    ordering_fields = ['date', 'time', 'created_at', 'exam_type']
    ordering = ['-date', '-time']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtre par type d'examen
        exam_type = self.request.query_params.get('exam_type')
        if exam_type and exam_type != 'all':
            queryset = queryset.filter(exam_type=exam_type)
        
        # Filtre par statut
        exam_status = self.request.query_params.get('status')
        if exam_status and exam_status != 'all':
            queryset = queryset.filter(status=exam_status)
        
        # Filtre par département
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(course__department=department)
        
        return queryset


class ExamDetail(generics.RetrieveUpdateDestroyAPIView):
    """Détails, mise à jour et suppression d'un examen"""
    queryset = Exam.objects.select_related('course').prefetch_related('grades').all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        # Utiliser le serializer détaillé pour GET
        if self.request.method == 'GET':
            return ExamDetailSerializer
        return ExamSerializer


class GradeListCreate(generics.ListCreateAPIView):
    """Liste et création de notes"""
    queryset = Grade.objects.select_related('student__user', 'exam__course').all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'exam', 'grade']
    search_fields = [
        'student__user__first_name', 
        'student__user__last_name',
        'student__student_id',
        'exam__title'
    ]
    ordering_fields = ['score', 'date_recorded']
    ordering = ['-date_recorded']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtre par étudiant
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filtre par examen
        exam_id = self.request.query_params.get('exam')
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
        
        return queryset


class GradeDetail(generics.RetrieveUpdateDestroyAPIView):
    """Détails, mise à jour et suppression d'une note"""
    queryset = Grade.objects.select_related('student__user', 'exam__course').all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def exam_statistics(request):
    """Statistiques des examens"""
    try:
        total_exams = Exam.objects.count()
        upcoming_exams = Exam.objects.filter(status='upcoming').count()
        ongoing_exams = Exam.objects.filter(status='ongoing').count()
        completed_exams = Exam.objects.filter(status='completed').count()
        cancelled_exams = Exam.objects.filter(status='cancelled').count()
        
        # Moyenne d'étudiants par examen
        avg_students = Exam.objects.aggregate(
            avg_enrolled=Avg('course__enrollments__id')
        )['avg_enrolled'] or 0
        
        # Examens par type
        exams_by_type = {}
        for exam_type, label in Exam.EXAM_TYPE_CHOICES:
            exams_by_type[exam_type] = Exam.objects.filter(exam_type=exam_type).count()
        
        # Examens prochains (7 prochains jours)
        from datetime import timedelta
        today = date.today()
        next_week = today + timedelta(days=7)
        upcoming_week = Exam.objects.filter(
            date__gte=today,
            date__lte=next_week,
            status='upcoming'
        ).count()
        
        # Notes moyennes
        avg_grade = Grade.objects.aggregate(avg_score=Avg('score'))['avg_score'] or 0
        total_grades = Grade.objects.count()
        
        return Response({
            'success': True,
            'data': {
                'total_exams': total_exams,
                'upcoming_exams': upcoming_exams,
                'ongoing_exams': ongoing_exams,
                'completed_exams': completed_exams,
                'cancelled_exams': cancelled_exams,
                'avg_students_per_exam': round(avg_students, 2),
                'exams_by_type': exams_by_type,
                'upcoming_this_week': upcoming_week,
                'total_grades': total_grades,
                'average_score': round(float(avg_grade), 2)
            }
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_exams(request):
    """Examens à venir"""
    try:
        limit = int(request.query_params.get('limit', 5))
        exams = Exam.objects.filter(
            status='upcoming',
            date__gte=date.today()
        ).select_related('course').order_by('date', 'time')[:limit]
        
        serializer = ExamSerializer(exams, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_create_grades(request):
    """Création en masse de notes pour un examen"""
    try:
        exam_id = request.data.get('exam_id')
        grades_data = request.data.get('grades', [])
        
        if not exam_id:
            return Response({
                'success': False,
                'error': "L'ID de l'examen est requis"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        exam = Exam.objects.get(id=exam_id)
        created_grades = []
        errors = []
        
        for grade_data in grades_data:
            try:
                grade_data['exam'] = exam_id
                serializer = GradeSerializer(data=grade_data)
                if serializer.is_valid():
                    serializer.save()
                    created_grades.append(serializer.data)
                else:
                    errors.append({
                        'student': grade_data.get('student'),
                        'errors': serializer.errors
                    })
            except Exception as e:
                errors.append({
                    'student': grade_data.get('student'),
                    'error': str(e)
                })
        
        return Response({
            'success': True,
            'data': {
                'created': len(created_grades),
                'failed': len(errors),
                'grades': created_grades,
                'errors': errors
            }
        })
    except Exam.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Examen non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)