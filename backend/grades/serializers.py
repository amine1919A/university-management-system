from rest_framework import serializers
from .models import Grade
from students.models import Student
from courses.models import Course

class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    course_code = serializers.SerializerMethodField()
    letter_grade = serializers.SerializerMethodField()
    is_passing = serializers.SerializerMethodField()
    
    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'course', 'course_name', 'course_code',
            'score', 'grade_category', 'letter_grade', 'is_passing',
            'semester', 'academic_year', 'comment',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'student': {'write_only': True},
            'course': {'write_only': True},
            'grade_category': {'read_only': True},
        }
    
    def get_student_name(self, obj):
        if obj.student and obj.student.user:
            return f"{obj.student.user.first_name} {obj.student.user.last_name}"
        return "Inconnu"
    
    def get_student_id(self, obj):
        return obj.student.student_id if obj.student else ""
    
    def get_course_name(self, obj):
        return obj.course.title if obj.course else ""
    
    def get_course_code(self, obj):
        return obj.course.course_code if obj.course else ""
    
    def get_letter_grade(self, obj):
        return obj.letter_grade
    
    def get_is_passing(self, obj):
        return obj.is_passing
    
    def validate_score(self, value):
        """Valider que la note est entre 0 et 20"""
        if value < 0 or value > 20:
            raise serializers.ValidationError("La note doit être entre 0 et 20")
        return value
    
    def validate(self, data):
        """Validation complète des données"""
        errors = {}
        
        # Vérifier que l'étudiant existe
        if 'student' in data:
            try:
                student_id = data['student'].id if hasattr(data['student'], 'id') else data['student']
                Student.objects.get(id=student_id)
            except (ValueError, TypeError):
                errors['student'] = ['ID étudiant invalide']
            except Student.DoesNotExist:
                errors['student'] = ['Étudiant non trouvé']
        
        # Vérifier que le cours existe
        if 'course' in data:
            try:
                course_id = data['course'].id if hasattr(data['course'], 'id') else data['course']
                Course.objects.get(id=course_id)
            except (ValueError, TypeError):
                errors['course'] = ['ID cours invalide']
            except Course.DoesNotExist:
                errors['course'] = ['Cours non trouvé']
        
        # Vérifier l'unicité
        if ('student' in data and 'course' in data and 
            'semester' in data and 'academic_year' in data and
            'student' not in errors and 'course' not in errors):
            
            try:
                student_id = data['student'].id if hasattr(data['student'], 'id') else data['student']
                course_id = data['course'].id if hasattr(data['course'], 'id') else data['course']
                
                existing = Grade.objects.filter(
                    student_id=student_id,
                    course_id=course_id,
                    semester=data['semester'],
                    academic_year=data['academic_year']
                )
                
                if self.instance:
                    existing = existing.exclude(id=self.instance.id)
                
                if existing.exists():
                    errors['non_field_errors'] = [
                        'Cet étudiant a déjà une note pour ce cours dans ce semestre et cette année académique.'
                    ]
            except Exception as e:
                print(f"Erreur vérification unicité: {str(e)}")
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data
    
    def create(self, validated_data):
        """Créer une note avec grade_category calculé automatiquement"""
        score = float(validated_data['score'])
        
        if score >= 15:
            validated_data['grade_category'] = 'excellent'
        elif score >= 10:
            validated_data['grade_category'] = 'good'
        elif score >= 5:
            validated_data['grade_category'] = 'average'
        else:
            validated_data['grade_category'] = 'fail'
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Mettre à jour une note avec grade_category recalculé"""
        if 'score' in validated_data:
            score = float(validated_data['score'])
            
            if score >= 15:
                validated_data['grade_category'] = 'excellent'
            elif score >= 10:
                validated_data['grade_category'] = 'good'
            elif score >= 5:
                validated_data['grade_category'] = 'average'
            else:
                validated_data['grade_category'] = 'fail'
        
        return super().update(instance, validated_data)


class StudentGradeSummarySerializer(serializers.ModelSerializer):
    """Serializer pour le résumé des notes d'un étudiant"""
    grades_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    passing_courses = serializers.SerializerMethodField()
    failing_courses = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 
            'user_first_name', 'user_last_name',
            'grades_count', 'average_score',
            'passing_courses', 'failing_courses'
        ]
    
    def get_grades_count(self, obj):
        return obj.student_grades.count()
    
    def get_average_score(self, obj):
        grades = obj.student_grades.all()
        if grades:
            total = sum(float(grade.score) for grade in grades)
            return round(total / len(grades), 2)
        return 0
    
    def get_passing_courses(self, obj):
        return obj.student_grades.filter(grade_category__in=['excellent', 'good']).count()
    
    def get_failing_courses(self, obj):
        return obj.student_grades.filter(grade_category='fail').count()


class BulkGradeCreateSerializer(serializers.Serializer):
    """Serializer pour la création en masse de notes"""
    grades = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_grades(self, value):
        for grade_data in value:
            if 'student' not in grade_data:
                raise serializers.ValidationError("Chaque note doit avoir un étudiant")
            if 'course' not in grade_data:
                raise serializers.ValidationError("Chaque note doit avoir un cours")
            if 'score' not in grade_data:
                raise serializers.ValidationError("Chaque note doit avoir une note")
        
        return value