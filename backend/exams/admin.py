from django.contrib import admin
from .models import Exam, Grade

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['exam_code', 'title', 'course', 'exam_type', 'date', 'time', 'status', 'enrolled_students_count']
    list_filter = ['exam_type', 'status', 'date', 'course__department']
    search_fields = ['title', 'course__title', 'course__course_code', 'location']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at', 'exam_code']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('course', 'exam_type', 'title', 'description', 'status')
        }),
        ('Date et lieu', {
            'fields': ('date', 'time', 'duration', 'location')
        }),
        ('Capacité', {
            'fields': ('max_students',)
        }),
        ('Métadonnées', {
            'fields': ('exam_code', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def enrolled_students_count(self, obj):
        return obj.enrolled_students_count
    enrolled_students_count.short_description = 'Étudiants inscrits'


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'score', 'grade', 'date_recorded']
    list_filter = ['grade', 'exam__exam_type', 'date_recorded']
    search_fields = [
        'student__user__first_name', 
        'student__user__last_name',
        'student__student_id',
        'exam__title'
    ]
    date_hierarchy = 'date_recorded'
    readonly_fields = ['grade', 'date_recorded']
    
    fieldsets = (
        ('Étudiant et Examen', {
            'fields': ('student', 'exam')
        }),
        ('Note', {
            'fields': ('score', 'grade', 'comments')
        }),
        ('Métadonnées', {
            'fields': ('date_recorded',),
            'classes': ('collapse',)
        }),
    )