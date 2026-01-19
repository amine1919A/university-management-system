from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime
from .models import Student
from .serializers import StudentWriteSerializer, StudentReadSerializer
from django.contrib.auth import get_user_model
import csv
from django.http import HttpResponse

User = get_user_model()

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def student_list(request):
    """Récupère la liste des étudiants (GET) ou crée un nouvel étudiant (POST)"""
    
    if request.method == 'GET':
        # Filtres
        search = request.GET.get('search', '')
        department = request.GET.get('department', '')
        status_filter = request.GET.get('status', '')
        
        students = Student.objects.select_related('user').all()
        
        # Application des filtres
        if search:
            students = students.filter(
                Q(student_id__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        if department and department != 'all':
            students = students.filter(department=department)
        
        if status_filter and status_filter != 'all':
            students = students.filter(status=status_filter)
        
        serializer = StudentReadSerializer(students, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Log les données reçues pour debug
        print("📋 Données reçues pour création d'étudiant:", request.data)
        
        serializer = StudentWriteSerializer(data=request.data)
        if serializer.is_valid():
            student = serializer.save()
            # Retourner les données complètes
            response_serializer = StudentReadSerializer(student)
            print("✅ Étudiant créé avec succès:", response_serializer.data)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        print("❌ Erreurs de validation:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def student_detail(request, pk):
    """Récupère/Met à jour/Supprime un étudiant spécifique"""
    try:
        student = Student.objects.select_related('user').get(pk=pk)
    except Student.DoesNotExist:
        return Response(
            {'error': 'Étudiant non trouvé'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = StudentReadSerializer(student)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Log les données reçues pour debug
        print(f"📋 Données reçues pour mise à jour étudiant {pk}:", request.data)
        
        serializer = StudentWriteSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            updated_student = serializer.save()
            # Retourner les données complètes
            response_serializer = StudentReadSerializer(updated_student)
            print("✅ Étudiant mis à jour avec succès:", response_serializer.data)
            return Response(response_serializer.data)
        
        print("❌ Erreurs de validation:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Supprimer l'étudiant (l'utilisateur sera supprimé automatiquement via CASCADE)
        student_id = student.id
        student.delete()
        print(f"✅ Étudiant {student_id} supprimé")
        return Response(
            {'message': 'Étudiant supprimé avec succès'},
            status=status.HTTP_204_NO_CONTENT
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_statistics(request):
    """Récupère les statistiques des étudiants"""
    try:
        total_students = Student.objects.count()
        active_students = Student.objects.filter(status='active').count()
        
        # Nouveaux étudiants ce mois-ci
        this_month_start = datetime.now().replace(day=1)
        new_this_month = Student.objects.filter(
            enrollment_date__gte=this_month_start
        ).count()
        
        # Calcul du taux de rétention
        total_active = Student.objects.filter(status='active').count()
        total_graduated = Student.objects.filter(status='graduated').count()
        
        if total_students > 0:
            retention_rate = round(((total_active + total_graduated) / total_students) * 100, 1)
        else:
            retention_rate = 0
        
        data = {
            'total_students': total_students,
            'active_students': active_students,
            'new_this_month': new_this_month,
            'retention_rate': retention_rate,
        }
        
        print("📈 Statistiques étudiants:", data)
        return Response(data)
        
    except Exception as e:
        print("❌ Erreur statistiques:", str(e))
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_students(request):
    """Exporte les étudiants en CSV"""
    try:
        # Créer la réponse HTTP
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="etudiants.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID Étudiant', 'Nom', 'Prénom', 'Email', 'Téléphone',
            'Département', 'Année en cours', 'GPA', 'Statut', 'Date d\'inscription'
        ])
        
        students = Student.objects.select_related('user').all()
        
        for student in students:
            writer.writerow([
                student.student_id,
                student.user.last_name if student.user else '',
                student.user.first_name if student.user else '',
                student.user.email if student.user else '',
                student.user.phone if hasattr(student.user, 'phone') else '',
                student.department,
                student.current_year,
                str(student.gpa),
                student.get_status_display(),
                student.enrollment_date.strftime('%d/%m/%Y') if student.enrollment_date else ''
            ])
        
        print("✅ Export CSV réalisé")
        return response
        
    except Exception as e:
        print("❌ Erreur export:", str(e))
        return Response({
            'error': 'Erreur lors de l\'export',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)