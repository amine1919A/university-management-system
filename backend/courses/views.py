from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Course, Enrollment
from .serializers import CourseSerializer, EnrollmentSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def course_list(request):
    """Récupère la liste des cours ou crée un nouveau cours"""
    if request.method == 'GET':
        courses = Course.objects.select_related('teacher', 'teacher__user').all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        print("📋 Données reçues pour création de cours:", request.data)
        
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            course = serializer.save()
            print("✅ Cours créé:", serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print("❌ Erreurs de validation:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def course_detail(request, pk):
    """
    Récupérer, mettre à jour ou supprimer un cours
    """
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response(
            {'error': 'Cours non trouvé'}, 
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = CourseSerializer(course)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        course.delete()
        return Response(
            {'message': 'Cours supprimé avec succès'}, 
            status=status.HTTP_204_NO_CONTENT
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def enrollment_list(request):
    """Récupère la liste des inscriptions ou crée une nouvelle inscription"""
    if request.method == 'GET':
        enrollments = Enrollment.objects.select_related('student', 'student__user', 'course').all()
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        print("📋 Données reçues pour création d'inscription:", request.data)
        
        serializer = EnrollmentSerializer(data=request.data)
        if serializer.is_valid():
            enrollment = serializer.save()
            print("✅ Inscription créée:", serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print("❌ Erreurs de validation:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def enrollment_detail(request, pk):
    """Récupère/Met à jour/Supprime une inscription spécifique"""
    try:
        enrollment = Enrollment.objects.select_related('student', 'student__user', 'course').get(pk=pk)
    except Enrollment.DoesNotExist:
        return Response(
            {'error': 'Inscription non trouvée'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        print(f"📋 Données reçues pour mise à jour inscription {pk}:", request.data)
        
        serializer = EnrollmentSerializer(enrollment, data=request.data, partial=True)
        if serializer.is_valid():
            updated_enrollment = serializer.save()
            print("✅ Inscription mise à jour:", serializer.data)
            return Response(serializer.data)
        
        print("❌ Erreurs de validation:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        enrollment_id = enrollment.id
        enrollment.delete()
        print(f"✅ Inscription {enrollment_id} supprimée")
        return Response(
            {'message': 'Inscription supprimée avec succès'},
            status=status.HTTP_204_NO_CONTENT
        )