from rest_framework import serializers
from .models import Exam, Grade
from courses.models import Course
from students.models import Student

class ExamSerializer(serializers.ModelSerializer):
    course_name = serializers.SerializerMethodField()
    course_code = serializers.SerializerMethodField()
    enrolled_students = serializers.SerializerMethodField()
    exam_code = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = [
            'id', 'course', 'course_name', 'course_code', 'exam_type', 
            'title', 'description', 'date', 'time', 'duration', 'location',
            'max_students', 'enrolled_students', 'status', 'exam_code',
            'department', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'exam_code']
    
    def get_course_name(self, obj):
        return obj.course.title if obj.course else "Inconnu"
    
    def get_course_code(self, obj):
        return obj.course.course_code if obj.course else ""
    
    def get_enrolled_students(self, obj):
        return obj.enrolled_students_count
    
    def get_exam_code(self, obj):
        return obj.exam_code
    
    def get_department(self, obj):
        return obj.course.department if obj.course else ""
    
    def validate_date(self, value):
        """Validation de la date"""
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError("La date de l'examen ne peut pas être dans le passé")
        return value
    
    def validate(self, data):
        """Validation globale"""
        if data.get('max_students', 0) < 1:
            raise serializers.ValidationError({
                'max_students': "Le nombre maximum d'étudiants doit être au moins 1"
            })
        return data


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_id_number = serializers.SerializerMethodField()
    exam_title = serializers.SerializerMethodField()
    exam_date = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name', 'student_id_number',
            'exam', 'exam_title', 'exam_date', 'course_name',
            'score', 'grade', 'comments', 'date_recorded'
        ]
        read_only_fields = ['grade', 'date_recorded']
    
    def get_student_name(self, obj):
        if obj.student and obj.student.user:
            return f"{obj.student.user.first_name} {obj.student.user.last_name}"
        return "Inconnu"
    
    def get_student_id_number(self, obj):
        return obj.student.student_id if obj.student else ""
    
    def get_exam_title(self, obj):
        return obj.exam.title if obj.exam else "Inconnu"
    
    def get_exam_date(self, obj):
        return obj.exam.date if obj.exam else None
    
    def get_course_name(self, obj):
        return obj.exam.course.title if obj.exam and obj.exam.course else "Inconnu"
    
    def validate_score(self, value):
        """Validation du score"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Le score doit être entre 0 et 100")
        return value


class ExamDetailSerializer(ExamSerializer):
    """Serializer détaillé avec les notes"""
    grades = GradeSerializer(many=True, read_only=True)
    grades_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    
    class Meta(ExamSerializer.Meta):
        fields = ExamSerializer.Meta.fields + ['grades', 'grades_count', 'average_score']
    
    def get_grades_count(self, obj):
        return obj.grades.count()
    
    def get_average_score(self, obj):
        from django.db.models import Avg
        avg = obj.grades.aggregate(Avg('score'))['score__avg']
        return round(float(avg), 2) if avg else 0.0