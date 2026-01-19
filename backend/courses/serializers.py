from rest_framework import serializers
from .models import Course, Enrollment
from teachers.models import Teacher
from students.models import Student

class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    enrollments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'course_code', 'title', 'description', 'credits',
            'department', 'semester', 'academic_year', 'teacher',
            'teacher_name', 'max_students', 'schedule', 'enrollments_count'
        ]
    
    def get_teacher_name(self, obj):
        """Récupère le nom complet de l'enseignant"""
        if obj.teacher and obj.teacher.user:
            return f"{obj.teacher.user.first_name} {obj.teacher.user.last_name}"
        return "Non assigné"
    
    def get_enrollments_count(self, obj):
        """Compte le nombre d'inscriptions"""
        return obj.enrollments.count()
    
    def validate_course_code(self, value):
        """Valide que le code du cours est unique"""
        # Exclure l'instance courante lors de la mise à jour
        instance = self.instance
        if instance:
            if Course.objects.filter(course_code=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError("Ce code de cours existe déjà.")
        else:
            # Création
            if Course.objects.filter(course_code=value).exists():
                raise serializers.ValidationError("Ce code de cours existe déjà.")
        return value

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    course_code = serializers.SerializerMethodField()
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'course', 'course_name',
            'course_code', 'enrollment_date', 'grade', 'status'
        ]
    
    def get_student_name(self, obj):
        """Récupère le nom complet de l'étudiant"""
        if obj.student and obj.student.user:
            return f"{obj.student.user.first_name} {obj.student.user.last_name}"
        return "Inconnu"
    
    def get_course_name(self, obj):
        """Récupère le titre du cours"""
        return obj.course.title if obj.course else "Inconnu"
    
    def get_course_code(self, obj):
        """Récupère le code du cours"""
        return obj.course.course_code if obj.course else "N/A"
    
    def validate(self, data):
        """Valide que l'étudiant n'est pas déjà inscrit au cours"""
        student = data.get('student')
        course = data.get('course')
        
        if student and course:
            if Enrollment.objects.filter(student=student, course=course).exists():
                raise serializers.ValidationError(
                    "Cet étudiant est déjà inscrit à ce cours."
                )
        
        return data