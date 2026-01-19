from django.db import models
from courses.models import Course
from students.models import Student

class Exam(models.Model):
    EXAM_TYPE_CHOICES = [
        ('final', 'Final'),
        ('midterm', 'Partiel'),
        ('quiz', 'Quiz'),
        ('oral', 'Oral'),
        ('practical', 'Pratique'),
    ]
    
    STATUS_CHOICES = [
        ('upcoming', 'À venir'),
        ('ongoing', 'En cours'),
        ('completed', 'Terminé'),
        ('cancelled', 'Annulé'),
    ]
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    time = models.TimeField()
    duration = models.CharField(max_length=50)  # e.g., '2 heures'
    location = models.CharField(max_length=100)
    max_students = models.IntegerField(default=30)
    status = models.CharField(max_length=20, default='upcoming', choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-time']
        verbose_name = 'Examen'
        verbose_name_plural = 'Examens'
    
    def __str__(self):
        return f"{self.get_exam_type_display()} - {self.course.title}"
    
    @property
    def enrolled_students_count(self):
        """Retourne le nombre d'étudiants inscrits au cours"""
        return self.course.enrollments.filter(status='enrolled').count()
    
    @property
    def exam_code(self):
        """Génère un code d'examen automatique"""
        return f"EXAM-{self.date.year}-{str(self.id).zfill(3)}"


class Grade(models.Model):
    GRADE_CHOICES = [
        ('A', 'A - Excellent'),
        ('B', 'B - Bien'),
        ('C', 'C - Assez bien'),
        ('D', 'D - Passable'),
        ('F', 'F - Échec'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='grades')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES, blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    date_recorded = models.DateField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'exam']
        ordering = ['-date_recorded']
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'
    
    def __str__(self):
        return f"{self.student} - {self.exam} : {self.score}"
    
    def save(self, *args, **kwargs):
        """Calculer automatiquement la lettre de note basée sur le score"""
        if self.score >= 90:
            self.grade = 'A'
        elif self.score >= 80:
            self.grade = 'B'
        elif self.score >= 70:
            self.grade = 'C'
        elif self.score >= 60:
            self.grade = 'D'
        else:
            self.grade = 'F'
        super().save(*args, **kwargs)