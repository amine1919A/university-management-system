import os
import django
import random
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'university_management.settings')
django.setup()

from accounts.models import User
from students.models import Student
from teachers.models import Teacher
from courses.models import Course, Enrollment
from exams.models import Exam, Grade
from finance.models import Transaction

def create_initial_data():
    # Créer un superutilisateur
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@university.com',
            password='admin123',
            first_name='Admin',
            last_name='System',
            user_type='admin'
        )
        print("Superutilisateur créé")
    
    # Créer des enseignants
    teachers_data = [
        {'first_name': 'Jean', 'last_name': 'Dupont', 'specialization': 'Mathématiques'},
        {'first_name': 'Marie', 'last_name': 'Curie', 'specialization': 'Physique'},
        {'first_name': 'Pierre', 'last_name': 'Martin', 'specialization': 'Informatique'},
        {'first_name': 'Sophie', 'last_name': 'Bernard', 'specialization': 'Chimie'},
        {'first_name': 'Luc', 'last_name': 'Dubois', 'specialization': 'Biologie'},
    ]
    
    for i, teacher_data in enumerate(teachers_data, 1):
        username = f'teacher{i}'
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=f'{username}@university.com',
                password='password123',
                first_name=teacher_data['first_name'],
                last_name=teacher_data['last_name'],
                user_type='teacher'
            )
            Teacher.objects.create(
                user=user,
                teacher_id=f'TEACH{i:03d}',
                hire_date=date(2020, 1, 1),
                department=teacher_data['specialization'],
                specialization=teacher_data['specialization'],
                rank='professor'
            )
            print(f"Enseignant {teacher_data['first_name']} créé")
    
    # Créer des étudiants
    students_data = [
        {'first_name': 'Alice', 'last_name': 'Martin', 'department': 'Informatique'},
        {'first_name': 'Bob', 'last_name': 'Durand', 'department': 'Mathématiques'},
        {'first_name': 'Charlie', 'last_name': 'Petit', 'department': 'Physique'},
        {'first_name': 'David', 'last_name': 'Laurent', 'department': 'Chimie'},
        {'first_name': 'Eve', 'last_name': 'Moreau', 'department': 'Biologie'},
    ]
    
    for i, student_data in enumerate(students_data, 1):
        username = f'student{i}'
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=f'{username}@university.com',
                password='password123',
                first_name=student_data['first_name'],
                last_name=student_data['last_name'],
                user_type='student'
            )
            Student.objects.create(
                user=user,
                student_id=f'STU{i:04d}',
                enrollment_date=date(2023, 9, 1),
                faculty='Sciences',
                department=student_data['department'],
                current_year=1,
                status='active'
            )
            print(f"Étudiant {student_data['first_name']} créé")
    
    print("Données initiales créées avec succès!")

if __name__ == '__main__':
    create_initial_data()