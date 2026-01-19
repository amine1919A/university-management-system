from django.db import models
from accounts.models import User

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    teacher_id = models.CharField(max_length=20, unique=True)
    hire_date = models.DateField()
    department = models.CharField(max_length=100)
    specialization = models.CharField(max_length=200)
    rank = models.CharField(max_length=50, choices=[
        ('professor', 'Professeur'),
        ('associate', 'Professeur Associé'),
        ('assistant', 'Assistant'),
        ('lecturer', 'Maître de Conférences'),
    ])
    office_number = models.CharField(max_length=20, blank=True)
    office_hours = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-hire_date']
    
    def __str__(self):
        return f"{self.teacher_id} - {self.user.get_full_name()}"