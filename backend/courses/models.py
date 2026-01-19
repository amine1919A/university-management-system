from django.db import models
from teachers.models import Teacher
from students.models import Student

class Course(models.Model):
    course_code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    credits = models.IntegerField()
    department = models.CharField(max_length=100)
    semester = models.CharField(max_length=20, choices=[
        ('fall', 'Automne'),
        ('spring', 'Printemps'),
        ('summer', 'Été'),
    ])
    academic_year = models.IntegerField()
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name='courses')
    max_students = models.IntegerField(default=30)
    schedule = models.TextField(blank=True)  # JSON string or text
    
    class Meta:
        ordering = ['course_code']
    
    def __str__(self):
        return f"{self.course_code} - {self.title}"

class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrollment_date = models.DateField(auto_now_add=True)
    grade = models.CharField(max_length=2, blank=True, choices=[
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
        ('F', 'F'),
    ])
    status = models.CharField(max_length=20, default='enrolled', choices=[
        ('enrolled', 'Inscrit'),
        ('completed', 'Terminé'),
        ('dropped', 'Abandonné'),
    ])
    
    class Meta:
        unique_together = ['student', 'course']
    
    def __str__(self):
        return f"{self.student} - {self.course}"