from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from students.models import Student
from courses.models import Course

class Grade(models.Model):
    GRADE_CATEGORY_CHOICES = [
        ('excellent', 'Excellent (15-20)'),
        ('good', 'Bien (10-14)'),
        ('average', 'Moyen (5-9)'),
        ('fail', 'Échec (0-4)'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_grades')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_grades')
    score = models.DecimalField(
        max_digits=4, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        help_text="Note sur 20"
    )
    grade_category = models.CharField(max_length=20, choices=GRADE_CATEGORY_CHOICES)
    semester = models.CharField(max_length=20, choices=[
        ('fall', 'Automne'),
        ('spring', 'Printemps'),
        ('summer', 'Été'),
    ])
    academic_year = models.IntegerField()
    comment = models.TextField(blank=True, null=True, help_text="Commentaires sur la note")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-academic_year', 'semester', 'course__course_code']
        unique_together = ['student', 'course', 'semester', 'academic_year']
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.course.course_code}: {self.score}/20"
    
    def save(self, *args, **kwargs):
        """Déterminer automatiquement la catégorie de note"""
        score = float(self.score)
        
        if score >= 15:
            self.grade_category = 'excellent'
        elif score >= 10:
            self.grade_category = 'good'
        elif score >= 5:
            self.grade_category = 'average'
        else:
            self.grade_category = 'fail'
        
        super().save(*args, **kwargs)
    
    @property
    def letter_grade(self):
        """Convertir la note numérique en lettre"""
        score = float(self.score)
        
        if score >= 18:
            return 'A+'
        elif score >= 16:
            return 'A'
        elif score >= 14:
            return 'B'
        elif score >= 12:
            return 'C+'
        elif score >= 10:
            return 'C'
        elif score >= 8:
            return 'D+'
        elif score >= 5:
            return 'D'
        else:
            return 'F'
    
    @property
    def is_passing(self):
        """Vérifier si la note est une réussite"""
        return float(self.score) >= 10