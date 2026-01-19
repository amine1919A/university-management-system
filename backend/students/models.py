from django.db import models
from accounts.models import User

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True)
    enrollment_date = models.DateField()
    graduation_date = models.DateField(null=True, blank=True)
    faculty = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    current_year = models.IntegerField(default=1)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('graduated', 'Diplômé'),
        ('suspended', 'Suspendu'),
    ], default='active')
    
    class Meta:
        ordering = ['-enrollment_date']
    
    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"