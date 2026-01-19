from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from datetime import datetime
from .models import Teacher
from .serializers import TeacherSerializer
from django.contrib.auth import get_user_model
import traceback

User = get_user_model()

def create_teacher_manually(data):
    """
    Fonction de secours pour créer un enseignant manuellement
    si le serializer échoue
    """
    try:
        print("🛠️ Création manuelle de l'enseignant...")
        
        # Créer l'utilisateur
        email = data['email']
        username = email
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{email}{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=data['first_name'],
            last_name=data['last_name'],
            password='defaultpassword123',
            user_type='teacher',
            phone=data.get('phone', ''),
            date_of_birth=data.get('date_of_birth')
        )
        
        print(f"✅ Utilisateur créé: {user.username}")
        
        # Créer l'enseignant
        teacher = Teacher.objects.create(
            user=user,
            teacher_id=data['teacher_id'],
            hire_date=data['hire_date'],
            department=data['department'],
            specialization=data['specialization'],
            rank=data['rank'],
            office_number=data.get('office_number', ''),
            office_hours=data.get('office_hours', '')
        )
        
        print(f"✅ Enseignant créé: {teacher.teacher_id}")
        return teacher
        
    except Exception as e:
        print(f"❌ Erreur création manuelle: {str(e)}")
        raise

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def teacher_list(request):
    if request.method == 'GET':
        try:
            # Filtres
            search = request.GET.get('search', '')
            department = request.GET.get('department', '')
            rank_filter = request.GET.get('rank', '')
            
            teachers = Teacher.objects.select_related('user').all()
            
            # Application des filtres
            if search:
                teachers = teachers.filter(
                    Q(teacher_id__icontains=search) |
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search) |
                    Q(specialization__icontains=search) |
                    Q(user__email__icontains=search)
                )
            
            if department and department != 'all':
                teachers = teachers.filter(department=department)
            
            if rank_filter and rank_filter != 'all':
                teachers = teachers.filter(rank=rank_filter)
            
            # Tri par défaut
            teachers = teachers.order_by('-hire_date')
            
            serializer = TeacherSerializer(teachers, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
                'count': teachers.count()
            })
            
        except Exception as e:
            print(f"❌ Erreur GET teachers: {str(e)}")
            traceback.print_exc()
            return Response({
                'success': False,
                'error': 'Erreur lors du chargement des enseignants',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            print("=" * 50)
            print("📝 POST /api/teachers/ - Création d'un enseignant")
            print(f"👤 Utilisateur: {request.user.username} ({request.user.user_type})")
            print(f"📋 Données reçues: {request.data}")
            print("=" * 50)
            
            # Validation des champs obligatoires
            required_fields = ['teacher_id', 'first_name', 'last_name', 'email', 
                             'hire_date', 'department', 'specialization', 'rank']
            
            missing_fields = []
            for field in required_fields:
                if field not in request.data or not request.data.get(field):
                    missing_fields.append(field)
            
            if missing_fields:
                return Response({
                    'success': False,
                    'error': 'Champs obligatoires manquants',
                    'missing_fields': missing_fields,
                    'message': f'Les champs suivants sont requis: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier si l'ID enseignant existe déjà
            teacher_id = request.data.get('teacher_id')
            if Teacher.objects.filter(teacher_id=teacher_id).exists():
                return Response({
                    'success': False,
                    'error': 'ID enseignant déjà utilisé',
                    'message': f"L'ID enseignant '{teacher_id}' existe déjà."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier si l'email existe déjà
            email = request.data.get('email')
            if User.objects.filter(email=email).exists():
                return Response({
                    'success': False,
                    'error': 'Email déjà utilisé',
                    'message': f"L'email '{email}' est déjà utilisé par un autre utilisateur."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Essayer d'abord avec le serializer
            serializer = None
            teacher = None
            
            try:
                serializer = TeacherSerializer(data=request.data)
                
                if serializer.is_valid():
                    print("✅ Serializer valide, création en cours...")
                    teacher = serializer.save()
                    print(f"✅ Enseignant créé via serializer: {teacher.teacher_id}")
                    
                else:
                    print("⚠️ Serializer invalide, tentative création manuelle...")
                    print(f"Erreurs serializer: {serializer.errors}")
                    
                    # Essayer la création manuelle
                    teacher = create_teacher_manually(request.data)
                    
                    # Créer un serializer pour la réponse
                    serializer = TeacherSerializer(teacher)
                    
            except Exception as serializer_error:
                print(f"⚠️ Erreur dans serializer: {str(serializer_error)}")
                print("🔄 Tentative création manuelle...")
                
                # Essayer la création manuelle en cas d'échec
                try:
                    teacher = create_teacher_manually(request.data)
                    serializer = TeacherSerializer(teacher)
                except Exception as manual_error:
                    print(f"❌ Échec création manuelle: {str(manual_error)}")
                    raise manual_error
            
            # Si on a réussi à créer l'enseignant
            if teacher and serializer:
                print(f"🎉 Enseignant créé avec succès:")
                print(f"   ID: {teacher.id}")
                print(f"   Teacher ID: {teacher.teacher_id}")
                print(f"   Nom: {teacher.user.get_full_name()}")
                print(f"   Email: {teacher.user.email}")
                print(f"   Username: {teacher.user.username}")
                
                # Retourner les données avec succès
                return Response({
                    'success': True,
                    'message': 'Enseignant créé avec succès',
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                raise Exception("Impossible de créer l'enseignant")
                
        except Exception as e:
            print("❌ Exception lors de la création:")
            print(f"   Type: {type(e).__name__}")
            print(f"   Message: {str(e)}")
            traceback.print_exc()
            
            # Message d'erreur plus spécifique
            error_message = str(e)
            if "UNIQUE constraint failed" in error_message:
                if "teachers_teacher.teacher_id" in error_message:
                    error_message = "Cet ID enseignant existe déjà"
                elif "accounts_user.email" in error_message:
                    error_message = "Cet email est déjà utilisé"
                elif "accounts_user.username" in error_message:
                    error_message = "Erreur de génération d'identifiant unique"
            
            return Response({
                'success': False,
                'error': 'Erreur serveur',
                'message': 'Une erreur est survenue lors de la création de l\'enseignant',
                'detail': error_message,
                'hint': "Vérifiez que l'ID enseignant et l'email sont uniques"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def teacher_detail(request, pk):
    try:
        teacher = Teacher.objects.select_related('user').get(pk=pk)
    except Teacher.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Non trouvé',
            'message': 'Enseignant non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        try:
            serializer = TeacherSerializer(teacher)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            print(f"❌ Erreur GET teacher/{pk}: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erreur lors du chargement',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PUT':
        try:
            print(f"🔄 PUT /api/teachers/{pk}/ - Mise à jour")
            print(f"📋 Données reçues: {request.data}")
            
            # Pour l'update, on permet les champs partiels
            serializer = TeacherSerializer(teacher, data=request.data, partial=True)
            
            if serializer.is_valid():
                updated_teacher = serializer.save()
                print(f"✅ Enseignant mis à jour: {updated_teacher.teacher_id}")
                
                return Response({
                    'success': True,
                    'message': 'Enseignant mis à jour avec succès',
                    'data': serializer.data
                })
            else:
                print("❌ Erreurs de validation:")
                for field, errors in serializer.errors.items():
                    print(f"   {field}: {errors}")
                
                formatted_errors = []
                for field, errors in serializer.errors.items():
                    if isinstance(errors, list):
                        for error in errors:
                            formatted_errors.append(f"{field}: {error}")
                    else:
                        formatted_errors.append(f"{field}: {errors}")
                
                return Response({
                    'success': False,
                    'error': 'Validation échouée',
                    'errors': serializer.errors,
                    'message': 'Veuillez corriger les erreurs ci-dessous',
                    'formatted_errors': formatted_errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"❌ Erreur update teacher/{pk}: {str(e)}")
            traceback.print_exc()
            return Response({
                'success': False,
                'error': 'Erreur lors de la mise à jour',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            teacher_id = teacher.teacher_id
            teacher_name = teacher.user.get_full_name()
            
            # Supprimer l'enseignant (le user sera supprimé automatiquement grâce à CASCADE)
            teacher.delete()
            print(f"🗑️ Enseignant supprimé: {teacher_id} - {teacher_name}")
            
            return Response({
                'success': True,
                'message': 'Enseignant supprimé avec succès'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur suppression teacher/{pk}: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erreur lors de la suppression',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_statistics(request):
    """Récupère les statistiques des enseignants"""
    try:
        total_teachers = Teacher.objects.count()
        
        # Répartition par département
        departments = Teacher.objects.values('department').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Répartition par grade
        ranks = Teacher.objects.values('rank').annotate(
            count=Count('id')
        ).order_by('rank')
        
        # Nouveaux enseignants ce mois-ci
        this_month_start = datetime.now().replace(day=1)
        new_this_month = Teacher.objects.filter(
            hire_date__gte=this_month_start
        ).count()
        
        # Enseignants avec bureau attribué
        with_office = Teacher.objects.filter(
            office_number__isnull=False
        ).exclude(office_number='').count()
        
        # Derniers enseignants ajoutés
        recent_teachers = Teacher.objects.select_related('user').order_by('-hire_date')[:5]
        recent_data = []
        for teacher in recent_teachers:
            recent_data.append({
                'id': teacher.id,
                'teacher_id': teacher.teacher_id,
                'name': teacher.user.get_full_name(),
                'department': teacher.department,
                'hire_date': teacher.hire_date
            })
        
        data = {
            'success': True,
            'total_teachers': total_teachers,
            'new_this_month': new_this_month,
            'with_office': with_office,
            'departments': list(departments),
            'ranks': list(ranks),
            'departments_count': len(departments),
            'ranks_count': len(ranks),
            'recent_teachers': recent_data
        }
        
        return Response(data)
        
    except Exception as e:
        print(f"❌ Erreur statistiques enseignants: {str(e)}")
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Erreur lors du calcul des statistiques'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)