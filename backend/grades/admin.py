from django.contrib import admin
from .models import Grade

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'score', 'grade_category', 'semester', 'academic_year', 'letter_grade', 'is_passing')
    list_filter = ('grade_category', 'semester', 'academic_year', 'course__department')
    search_fields = ('student__user__first_name', 'student__user__last_name', 'student__student_id', 'course__title')
    readonly_fields = ('created_at', 'updated_at', 'letter_grade', 'is_passing')
    fieldsets = (
        ('Informations de base', {
            'fields': ('student', 'course', 'score', 'grade_category')
        }),
        ('Contexte académique', {
            'fields': ('semester', 'academic_year')
        }),
        ('Commentaires', {
            'fields': ('comment',)
        }),
        ('Informations système', {
            'fields': ('created_at', 'updated_at', 'letter_grade', 'is_passing'),
            'classes': ('collapse',)
        }),
    )