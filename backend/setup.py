import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'university_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import User
from students.models import Student
from teachers.models import Teacher

def setup_initial_data():
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
        print("✅ Superutilisateur créé (admin / admin123)")
    
    # Créer un utilisateur test
    if not User.objects.filter(username='test').exists():
        user = User.objects.create_user(
            username='test',
            email='test@university.com',
            password='test123',
            first_name='Test',
            last_name='User',
            user_type='admin'
        )
        print("✅ Utilisateur test créé (test / test123)")
    
    # Créer quelques étudiants de test
    if not Student.objects.exists():
        student_user1 = User.objects.create_user(
            username='etudiant1',
            email='etudiant1@university.com',
            password='student123',
            first_name='Jean',
            last_name='Dupont',
            user_type='student'
        )
        Student.objects.create(
            user=student_user1,
            student_id='STU001',
            enrollment_date='2023-09-01',
            faculty='Sciences',
            department='Informatique',
            current_year=2,
            status='active'
        )
        
        student_user2 = User.objects.create_user(
            username='etudiant2',
            email='etudiant2@university.com',
            password='student123',
            first_name='Marie',
            last_name='Curie',
            user_type='student'
        )
        Student.objects.create(
            user=student_user2,
            student_id='STU002',
            enrollment_date='2023-09-01',
            faculty='Sciences',
            department='Physique',
            current_year=3,
            status='active'
        )
        print("✅ 2 étudiants créés")
    
    # Créer quelques enseignants de test
    if not Teacher.objects.exists():
        teacher_user1 = User.objects.create_user(
            username='enseignant1',
            email='enseignant1@university.com',
            password='teacher123',
            first_name='Pierre',
            last_name='Martin',
            user_type='teacher'
        )
        Teacher.objects.create(
            user=teacher_user1,
            teacher_id='TEACH001',
            hire_date='2020-01-01',
            department='Informatique',
            specialization='Algorithmique',
            rank='professor'
        )
        
        teacher_user2 = User.objects.create_user(
            username='enseignant2',
            email='enseignant2@university.com',
            password='teacher123',
            first_name='Sophie',
            last_name='Bernard',
            user_type='teacher'
        )
        Teacher.objects.create(
            user=teacher_user2,
            teacher_id='TEACH002',
            hire_date='2021-01-01',
            department='Physique',
            specialization='Physique Quantique',
            rank='associate'
        )
        print("✅ 2 enseignants créés")
    
    print("\n🎉 Configuration initiale terminée avec succès!")
    print("\n📋 Comptes créés:")
    print("   - admin / admin123 (superuser)")
    print("   - test / test123 (admin)")
    print("   - etudiant1 / student123 (étudiant)")
    print("   - enseignant1 / teacher123 (enseignant)")

if __name__ == '__main__':
    setup_initial_data()