from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Max, Min, Q
from django.shortcuts import get_object_or_404
from .models import Grade
from .serializers import GradeSerializer, StudentGradeSummarySerializer, BulkGradeCreateSerializer
from students.models import Student
from courses.models import Course
import logging

# Configuration du logger
logger = logging.getLogger(__name__)




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def grade_list(request):
    """Liste et création de notes"""
    if request.method == 'GET':
        try:
            # Récupérer les paramètres de filtrage
            student_id = request.GET.get('student')
            course_id = request.GET.get('course')
            semester = request.GET.get('semester')
            academic_year = request.GET.get('academic_year')
            min_score = request.GET.get('min_score')
            max_score = request.GET.get('max_score')
            grade_category = request.GET.get('grade_category')
            
            # Log des paramètres
            logger.info(f"GET grades with params: student_id={student_id}, course_id={course_id}, semester={semester}")
            
            grades = Grade.objects.select_related('student__user', 'course').all()
            
            # Appliquer les filtres
            if student_id:
                try:
                    grades = grades.filter(student_id=int(student_id))
                except ValueError:
                    return Response({
                        'success': False,
                        'error': 'ID étudiant invalide',
                        'detail': 'L\'ID étudiant doit être un nombre'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if course_id:
                try:
                    grades = grades.filter(course_id=int(course_id))
                except ValueError:
                    return Response({
                        'success': False,
                        'error': 'ID cours invalide',
                        'detail': 'L\'ID cours doit être un nombre'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if semester and semester != 'all':
                grades = grades.filter(semester=semester)
            
            if academic_year:
                try:
                    grades = grades.filter(academic_year=int(academic_year))
                except ValueError:
                    return Response({
                        'success': False,
                        'error': 'Année académique invalide',
                        'detail': 'L\'année académique doit être un nombre'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if min_score:
                try:
                    grades = grades.filter(score__gte=float(min_score))
                except ValueError:
                    return Response({
                        'success': False,
                        'error': 'Note minimale invalide',
                        'detail': 'La note minimale doit être un nombre'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if max_score:
                try:
                    grades = grades.filter(score__lte=float(max_score))
                except ValueError:
                    return Response({
                        'success': False,
                        'error': 'Note maximale invalide',
                        'detail': 'La note maximale doit être un nombre'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if grade_category and grade_category != 'all':
                grades = grades.filter(grade_category=grade_category)
            
            # Trier par défaut
            grades = grades.order_by('-academic_year', 'semester', 'course__course_code')
            
            # Compter avant sérialisation
            total_count = grades.count()
            
            serializer = GradeSerializer(grades, many=True)
            
            return Response({
                'success': True,
                'count': total_count,
                'results': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error in grade_list GET: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Erreur lors de la récupération des notes',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            logger.info(f"POST grade - User: {request.user.username}")
            logger.info(f"POST data: {request.data}")
            
            # Copier les données
            data = request.data.copy()
            
            # Log des données reçues
            logger.info(f"Données brutes reçues: {data}")
            
            # Vérifier les champs requis
            required_fields = ['student', 'course', 'score']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                logger.error(f"Champs manquants: {missing_fields}")
                return Response({
                    'success': False,
                    'error': 'Champs requis manquants',
                    'detail': f'Champs manquants: {", ".join(missing_fields)}',
                    'missing_fields': missing_fields
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convertir les types avec gestion d'erreur
            try:
                data['student'] = int(data['student'])
                data['course'] = int(data['course'])
                data['score'] = float(data['score'])
                
                # Vérifier que la note est valide
                if data['score'] < 0 or data['score'] > 20:
                    return Response({
                        'success': False,
                        'error': 'Note invalide',
                        'detail': 'La note doit être entre 0 et 20',
                        'score': data['score']
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                if 'academic_year' in data:
                    data['academic_year'] = int(data['academic_year'])
                else:
                    # Valeur par défaut
                    data['academic_year'] = datetime.now().year
                
                if 'semester' not in data:
                    data['semester'] = 'fall'
                
                if 'comment' not in data:
                    data['comment'] = ''
                    
            except (ValueError, TypeError) as e:
                logger.error(f"Erreur conversion types: {str(e)}")
                return Response({
                    'success': False,
                    'error': 'Type de données invalide',
                    'detail': f'Erreur de conversion: {str(e)}',
                    'student_type': type(data.get('student')),
                    'course_type': type(data.get('course')),
                    'score_type': type(data.get('score'))
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier que l'étudiant existe
            try:
                student = Student.objects.get(id=data['student'])
                logger.info(f"Étudiant trouvé: {student.id} - {student.user.get_full_name()}")
            except Student.DoesNotExist:
                logger.error(f"Étudiant non trouvé: ID {data['student']}")
                return Response({
                    'success': False,
                    'error': 'Étudiant non trouvé',
                    'detail': f'Aucun étudiant avec l\'ID {data["student"]}',
                    'student_id': data['student']
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                logger.error(f"Erreur récupération étudiant: {str(e)}")
                return Response({
                    'success': False,
                    'error': 'Erreur étudiant',
                    'detail': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier que le cours existe
            try:
                course = Course.objects.get(id=data['course'])
                logger.info(f"Cours trouvé: {course.id} - {course.course_code}")
            except Course.DoesNotExist:
                logger.error(f"Cours non trouvé: ID {data['course']}")
                return Response({
                    'success': False,
                    'error': 'Cours non trouvé',
                    'detail': f'Aucun cours avec l\'ID {data["course"]}',
                    'course_id': data['course']
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                logger.error(f"Erreur récupération cours: {str(e)}")
                return Response({
                    'success': False,
                    'error': 'Erreur cours',
                    'detail': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Log des données après validation
            logger.info(f"Données validées: {data}")
            
            # Vérifier l'unicité (un étudiant ne peut avoir qu'une note par cours/semestre/année)
            existing_grade = Grade.objects.filter(
                student_id=data['student'],
                course_id=data['course'],
                semester=data['semester'],
                academic_year=data['academic_year']
            ).first()
            
            if existing_grade:
                logger.warning(f"Note déjà existante: {existing_grade.id}")
                return Response({
                    'success': False,
                    'error': 'Note déjà existante',
                    'detail': 'Cet étudiant a déjà une note pour ce cours dans ce semestre et cette année académique.',
                    'existing_grade_id': existing_grade.id,
                    'existing_grade': {
                        'id': existing_grade.id,
                        'score': float(existing_grade.score),
                        'grade_category': existing_grade.grade_category
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Utiliser le serializer
            serializer = GradeSerializer(data=data)
            
            if serializer.is_valid():
                logger.info("Serializer valide, création de la note...")
                grade = serializer.save()
                logger.info(f"✅ Note créée avec succès: ID {grade.id}")
                
                # Retourner les données avec les champs calculés
                response_data = GradeSerializer(grade).data
                
                return Response({
                    'success': True,
                    'message': 'Note ajoutée avec succès',
                    'data': response_data
                }, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Serializer invalide: {serializer.errors}")
                return Response({
                    'success': False,
                    'error': 'Validation des données échouée',
                    'errors': serializer.errors,
                    'detail': 'Veuillez vérifier les données soumises'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Exception dans grade_list POST: {str(e)}", exc_info=True)
            import traceback
            traceback_str = traceback.format_exc()
            logger.error(f"Traceback: {traceback_str}")
            
            return Response({
                'success': False,
                'error': 'Erreur serveur lors de la création de la note',
                'detail': str(e),
                'traceback': traceback_str if request.user.is_superuser else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Ajouter cette fonction APRÈS la fonction grade_list

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def grade_detail(request, pk):
    """Détails, mise à jour et suppression d'une note"""
    try:
        grade = get_object_or_404(Grade.objects.select_related('student__user', 'course'), pk=pk)
    except Grade.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Note non trouvée',
            'detail': f'Aucune note avec l\'ID {pk}'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        try:
            serializer = GradeSerializer(grade)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            logger.error(f"Error in grade_detail GET: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erreur lors de la récupération de la note',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PUT':
        try:
            data = request.data.copy()
            logger.info(f"PUT grade {pk} - Data: {data}")
            
            # Validation de la note si fournie
            if 'score' in data:
                try:
                    score = float(data['score'])
                    if score < 0 or score > 20:
                        return Response({
                            'success': False,
                            'error': 'Note invalide',
                            'detail': 'La note doit être entre 0 et 20'
                        }, status=status.HTTP_400_BAD_REQUEST)
                except (ValueError, TypeError):
                    return Response({
                        'success': False,
                        'error': 'Note invalide',
                        'detail': 'La note doit être un nombre valide'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convertir les IDs si fournis
            if 'student' in data:
                try:
                    data['student'] = int(data['student'])
                except (ValueError, TypeError):
                    return Response({
                        'success': False,
                        'error': 'Étudiant invalide',
                        'detail': 'L\'ID étudiant doit être un nombre'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if 'course' in data:
                try:
                    data['course'] = int(data['course'])
                except (ValueError, TypeError):
                    return Response({
                        'success': False,
                        'error': 'Cours invalide',
                        'detail': 'L\'ID cours doit être un nombre'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if 'academic_year' in data:
                try:
                    data['academic_year'] = int(data['academic_year'])
                except (ValueError, TypeError):
                    return Response({
                        'success': False,
                        'error': 'Année invalide',
                        'detail': 'L\'année académique doit être un nombre'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = GradeSerializer(grade, data=data, partial=True)
            if serializer.is_valid():
                updated_grade = serializer.save()
                logger.info(f"✅ Note {pk} mise à jour avec succès")
                
                return Response({
                    'success': True,
                    'message': 'Note mise à jour avec succès',
                    'data': serializer.data
                })
            
            logger.error(f"Serializer invalide pour PUT: {serializer.errors}")
            return Response({
                'success': False,
                'error': 'Données invalides',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error in grade_detail PUT: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erreur lors de la mise à jour de la note',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            grade_id = grade.id
            student_info = f"{grade.student.user.get_full_name()}" if grade.student and grade.student.user else "Inconnu"
            course_info = f"{grade.course.course_code}" if grade.course else "Inconnu"
            
            grade.delete()
            logger.info(f"✅ Note {grade_id} supprimée (Étudiant: {student_info}, Cours: {course_info})")
            
            return Response({
                'success': True,
                'message': 'Note supprimée avec succès'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in grade_detail DELETE: {str(e)}")
            return Response({
                'success': False,
                'error': 'Erreur lors de la suppression de la note',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_grades(request, student_id):
    """Récupérer toutes les notes d'un étudiant"""
    try:
        student = get_object_or_404(Student, id=student_id)
        grades = Grade.objects.filter(student=student).select_related('course')
        
        serializer = GradeSerializer(grades, many=True)
        
        # Statistiques
        if grades:
            stats = grades.aggregate(
                total=Count('id'),
                average=Avg('score'),
                passing=Count('id', filter=Q(score__gte=10)),
                failing=Count('id', filter=Q(score__lt=10))
            )
            
            stats_data = {
                'total_grades': stats['total'] or 0,
                'average_score': round(float(stats['average'] or 0), 2),
                'passing_courses': stats['passing'] or 0,
                'failing_courses': stats['failing'] or 0,
                'success_rate': round((stats['passing'] / stats['total']) * 100, 2) if stats['total'] > 0 else 0
            }
        else:
            stats_data = {
                'total_grades': 0,
                'average_score': 0,
                'passing_courses': 0,
                'failing_courses': 0,
                'success_rate': 0
            }
        
        return Response({
            'success': True,
            'student': {
                'id': student.id,
                'student_id': student.student_id,
                'name': student.user.get_full_name(),
                'department': student.department,
                'current_year': student.current_year
            },
            'stats': stats_data,
            'grades': serializer.data
        })
        
    except Student.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Étudiant non trouvé',
            'detail': f'Aucun étudiant avec l\'ID {student_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in student_grades: {str(e)}")
        return Response({
            'success': False,
            'error': 'Erreur lors de la récupération des notes de l\'étudiant',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_grades(request, course_id):
    """Récupérer toutes les notes d'un cours"""
    try:
        course = get_object_or_404(Course, id=course_id)
        grades = Grade.objects.filter(course=course).select_related('student__user')
        
        serializer = GradeSerializer(grades, many=True)
        
        # Statistiques du cours
        if grades:
            stats = grades.aggregate(
                total=Count('id'),
                average=Avg('score'),
                highest=Max('score'),
                lowest=Min('score'),
                passing=Count('id', filter=Q(score__gte=10))
            )
            
            stats_data = {
                'total_students': stats['total'] or 0,
                'average_score': round(float(stats['average'] or 0), 2),
                'highest_score': float(stats['highest'] or 0),
                'lowest_score': float(stats['lowest'] or 0),
                'passing_rate': round((stats['passing'] / stats['total']) * 100, 2) if stats['total'] > 0 else 0
            }
        else:
            stats_data = {
                'total_students': 0,
                'average_score': 0,
                'highest_score': 0,
                'lowest_score': 0,
                'passing_rate': 0
            }
        
        return Response({
            'success': True,
            'course': {
                'id': course.id,
                'course_code': course.course_code,
                'title': course.title,
                'credits': course.credits,
                'department': course.department
            },
            'stats': stats_data,
            'grades': serializer.data
        })
        
    except Course.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Cours non trouvé',
            'detail': f'Aucun cours avec l\'ID {course_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in course_grades: {str(e)}")
        return Response({
            'success': False,
            'error': 'Erreur lors de la récupération des notes du cours',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grade_statistics(request):
    """Statistiques générales des notes"""
    try:
        total_grades = Grade.objects.count()
        
        if total_grades == 0:
            return Response({
                'success': True,
                'data': {
                    'total_grades': 0,
                    'average_score': 0,
                    'distribution': {
                        'excellent': 0,
                        'good': 0,
                        'average': 0,
                        'fail': 0
                    },
                    'passing_rate': 0,
                    'top_courses': [],
                    'top_students': []
                }
            })
        
        # Score moyen général
        overall_stats = Grade.objects.aggregate(
            average=Avg('score'),
            passing=Count('id', filter=Q(score__gte=10))
        )
        
        # Distribution par catégorie
        distribution = {
            'excellent': Grade.objects.filter(grade_category='excellent').count(),
            'good': Grade.objects.filter(grade_category='good').count(),
            'average': Grade.objects.filter(grade_category='average').count(),
            'fail': Grade.objects.filter(grade_category='fail').count()
        }
        
        # Taux de réussite
        passing_rate = round((overall_stats['passing'] / total_grades) * 100, 2)
        
        # Top 5 cours avec les meilleures moyennes
        top_courses = Course.objects.annotate(
            avg_score=Avg('course_grades__score'),
            grade_count=Count('course_grades')
        ).filter(grade_count__gt=0).order_by('-avg_score')[:5]
        
        top_courses_data = []
        for course in top_courses:
            top_courses_data.append({
                'id': course.id,
                'course_code': course.course_code,
                'title': course.title,
                'average_score': round(float(course.avg_score), 2),
                'total_grades': course.grade_count
            })
        
        # Top 5 étudiants avec les meilleures moyennes
        top_students = Student.objects.annotate(
            avg_score=Avg('student_grades__score'),
            grade_count=Count('student_grades')
        ).filter(grade_count__gt=0).order_by('-avg_score')[:5]
        
        top_students_data = []
        for student in top_students:
            top_students_data.append({
                'id': student.id,
                'student_id': student.student_id,
                'name': student.user.get_full_name(),
                'average_score': round(float(student.avg_score), 2),
                'total_grades': student.grade_count
            })
        
        return Response({
            'success': True,
            'data': {
                'total_grades': total_grades,
                'average_score': round(float(overall_stats['average'] or 0), 2),
                'distribution': distribution,
                'passing_rate': passing_rate,
                'top_courses': top_courses_data,
                'top_students': top_students_data
            }
        })
        
    except Exception as e:
        logger.error(f"Error in grade_statistics: {str(e)}")
        return Response({
            'success': False,
            'error': 'Erreur lors du calcul des statistiques',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_create_grades(request):
    """Création en masse de notes"""
    try:
        serializer = BulkGradeCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': 'Données invalides',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        grades_data = serializer.validated_data['grades']
        created_grades = []
        errors = []
        
        for index, grade_data in enumerate(grades_data):
            try:
                grade_serializer = GradeSerializer(data=grade_data)
                if grade_serializer.is_valid():
                    grade = grade_serializer.save()
                    created_grades.append(grade_serializer.data)
                else:
                    errors.append({
                        'index': index,
                        'data': grade_data,
                        'errors': grade_serializer.errors
                    })
            except Exception as e:
                errors.append({
                    'index': index,
                    'data': grade_data,
                    'error': str(e)
                })
        
        return Response({
            'success': True,
            'message': f'{len(created_grades)} notes créées avec succès, {len(errors)} erreurs',
            'created': len(created_grades),
            'failed': len(errors),
            'grades': created_grades,
            'errors': errors
        })
        
    except Exception as e:
        logger.error(f"Error in bulk_create_grades: {str(e)}")
        return Response({
            'success': False,
            'error': 'Erreur lors de la création en masse',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_grade_summary(request):
    """Résumé des notes pour tous les étudiants"""
    try:
        students = Student.objects.annotate(
            grades_count=Count('student_grades'),
            avg_score=Avg('student_grades__score')
        ).filter(grades_count__gt=0)
        
        serializer = StudentGradeSummarySerializer(students, many=True)
        
        return Response({
            'success': True,
            'count': students.count(),
            'results': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error in student_grade_summary: {str(e)}")
        return Response({
            'success': False,
            'error': 'Erreur lors de la récupération du résumé',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def test_api(request):
    """Endpoint de test pour vérifier que l'API fonctionne"""
    return Response({
        'success': True,
        'message': 'Grades API is working',
        'status': 'OK',
        'endpoints': {
            'GET /': 'List all grades',
            'POST /': 'Create a grade',
            'GET /<id>/': 'Get grade details',
            'PUT /<id>/': 'Update grade',
            'DELETE /<id>/': 'Delete grade',
            'GET /student/<student_id>/': 'Get student grades',
            'GET /course/<course_id>/': 'Get course grades',
            'GET /statistics/': 'Get statistics',
            'GET /summary/': 'Get student summary',
            'POST /bulk/': 'Bulk create grades',
            'GET /test/': 'Test endpoint'
        }
    })