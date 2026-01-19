import os
import sys
import django
import random
from datetime import datetime, timedelta

# Configuration Django pour créer des données directement
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'university_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Student
from finance.models import Transaction, Budget
from django.db.models import Sum, Count

User = get_user_model()

def create_all_data():
    """Créer TOUTES les données nécessaires pour le système financier"""
    print("🚀 Démarrage de la création complète de données...")
    print("="*80)
    print("CRÉATION COMPLÈTE DE DONNÉES POUR LE SYSTÈME FINANCIER")
    print("="*80)
    
    created_students = []
    
    # ================================================================
    # 1. CRÉATION DES ÉTUDIANTS (CORRIGÉ selon votre modèle)
    # ================================================================
    print("\n" + "="*80)
    print("1. CRÉATION DES ÉTUDIANTS")
    print("="*80)
    
    arab_students = [
        {"first_name": "Ahmed", "last_name": "Mohamed", "email": "ahmed@iteam.edu.tn", "student_id": "IT2024001"},
        {"first_name": "Mohamed", "last_name": "Ali", "email": "mohamed@iteam.edu.tn", "student_id": "IT2024002"},
        {"first_name": "Khaled", "last_name": "Hassan", "email": "khaled@iteam.edu.tn", "student_id": "IT2024003"},
        {"first_name": "Sarah", "last_name": "Abdullah", "email": "sara@iteam.edu.tn", "student_id": "IT2024004"},
        {"first_name": "Fatima", "last_name": "Mahmoud", "email": "fatima@iteam.edu.tn", "student_id": "IT2024005"},
        {"first_name": "Ali", "last_name": "Ibrahim", "email": "ali@iteam.edu.tn", "student_id": "IT2024006"},
        {"first_name": "Mariam", "last_name": "Said", "email": "mariam@iteam.edu.tn", "student_id": "IT2024007"},
        {"first_name": "Youssef", "last_name": "Rachid", "email": "youssef@iteam.edu.tn", "student_id": "IT2024008"},
        {"first_name": "Nour", "last_name": "Eddine", "email": "nour@iteam.edu.tn", "student_id": "IT2024009"},
        {"first_name": "Leila", "last_name": "Kamal", "email": "leila@iteam.edu.tn", "student_id": "IT2024010"},
        {"first_name": "Hassan", "last_name": "Abdelrahman", "email": "hassan@iteam.edu.tn", "student_id": "IT2024011"},
        {"first_name": "Amena", "last_name": "Mostafa", "email": "amena@iteam.edu.tn", "student_id": "IT2024012"},
        {"first_name": "Tarek", "last_name": "Jamal", "email": "tarek@iteam.edu.tn", "student_id": "IT2024013"},
        {"first_name": "Samia", "last_name": "Zain", "email": "samia@iteam.edu.tn", "student_id": "IT2024014"},
        {"first_name": "Bachir", "last_name": "Omar", "email": "bachir@iteam.edu.tn", "student_id": "IT2024015"},
    ]
    
    # Facultés et départements pour les étudiants
    faculties = ["Faculté d'Ingénierie", "Faculté de Médecine", "Faculté des Sciences", "Faculté d'Économie"]
    departments = {
        "Faculté d'Ingénierie": ["Informatique", "Génie Civil", "Génie Électrique"],
        "Faculté de Médecine": ["Médecine Générale", "Chirurgie", "Pédiatrie"],
        "Faculté des Sciences": ["Mathématiques", "Physique", "Chimie"],
        "Faculté d'Économie": ["Économie", "Gestion", "Finance"]
    }
    
    for i, student_data in enumerate(arab_students, 1):
        try:
            # Vérifier si l'utilisateur existe déjà
            user_exists = User.objects.filter(email=student_data['email']).exists()
            
            if not user_exists:
                # Créer l'utilisateur
                user = User.objects.create_user(
                    username=f"student{i}",
                    email=student_data['email'],
                    password='password123',
                    first_name=student_data['first_name'],
                    last_name=student_data['last_name'],
                    is_active=True
                )
                print(f"   ✅ Utilisateur créé: {student_data['first_name']} {student_data['last_name']}")
            else:
                # Récupérer l'utilisateur existant
                user = User.objects.get(email=student_data['email'])
                print(f"   ⚠️ Utilisateur existe déjà: {student_data['first_name']} {student_data['last_name']}")
            
            # Vérifier si l'étudiant existe déjà
            student_exists = Student.objects.filter(student_id=student_data['student_id']).exists()
            
            if not student_exists:
                # Sélectionner aléatoirement une faculté et un département
                faculty = random.choice(faculties)
                department = random.choice(departments[faculty])
                
                # Créer l'étudiant avec les champs CORRECTS de votre modèle
                student = Student.objects.create(
                    user=user,
                    student_id=student_data['student_id'],
                    enrollment_date=datetime.now().date() - timedelta(days=random.randint(100, 500)),
                    graduation_date=None,  # Pas encore diplômé
                    faculty=faculty,
                    department=department,
                    current_year=random.randint(1, 5),
                    gpa=random.uniform(2.0, 4.0),
                    status='active'
                )
                print(f"   ✅ Étudiant créé: {student_data['first_name']} {student_data['last_name']}")
            else:
                # Récupérer l'étudiant existant
                student = Student.objects.get(student_id=student_data['student_id'])
                print(f"   ⚠️ Étudiant existe déjà: {student_data['first_name']} {student_data['last_name']}")
            
            created_students.append(student)
            
        except Exception as e:
            print(f"   ❌ Erreur: {student_data['first_name']} - {str(e)}")
    
    # Si aucun étudiant n'a été créé, créer au moins un étudiant de test
    if len(created_students) == 0:
        print("\n⚠️ Aucun étudiant créé. Création d'un étudiant de test...")
        try:
            # Créer l'utilisateur
            user = User.objects.create_user(
                username="test_student",
                email="test@iteam.edu.tn",
                password='password123',
                first_name="Test",
                last_name="Student",
                is_active=True
            )
            
            # Créer l'étudiant
            student = Student.objects.create(
                user=user,
                student_id="IT2024999",
                enrollment_date=datetime.now().date() - timedelta(days=200),
                graduation_date=None,
                faculty="Faculté d'Ingénierie",
                department="Informatique",
                current_year=3,
                gpa=3.5,
                status='active'
            )
            created_students.append(student)
            print(f"   ✅ Étudiant test créé: Test Student")
        except Exception as e:
            print(f"   ❌ Erreur création étudiant test: {str(e)}")
            # Sortir du script car on ne peut pas continuer sans étudiants
            return {'students': 0, 'transactions': 0, 'budgets': 0}
    
    print(f"\n📊 Total étudiants disponibles: {len(created_students)}")
    
    # ================================================================
    # 2. CRÉATION DES TRANSACTIONS
    # ================================================================
    print("\n" + "="*80)
    print("2. CRÉATION DES TRANSACTIONS")
    print("="*80)
    
    # Nettoyer les anciennes transactions
    Transaction.objects.all().delete()
    print("   ✅ Anciennes transactions supprimées")
    
    # Dates pour les transactions
    today = datetime.now().date()
    dates = [
        today - timedelta(days=30),  # Passé
        today - timedelta(days=15),  # Récent
        today,                       # Aujourd'hui
        today + timedelta(days=15),  # Futur proche
        today + timedelta(days=30),  # Futur
    ]
    
    # Types de transactions avec variétés
    transaction_types = [
        {"type": "tuition", "amount_range": (1000, 1500), "status_weights": {"paid": 0.6, "pending": 0.3, "overdue": 0.1}},
        {"type": "exam_fee", "amount_range": (50, 100), "status_weights": {"paid": 0.8, "pending": 0.2, "overdue": 0.0}},
        {"type": "lab_fee", "amount_range": (30, 80), "status_weights": {"paid": 0.7, "pending": 0.2, "overdue": 0.1}},
        {"type": "library_fee", "amount_range": (20, 50), "status_weights": {"paid": 0.9, "pending": 0.1, "overdue": 0.0}},
        {"type": "scholarship", "amount_range": (-800, -200), "status_weights": {"paid": 1.0, "pending": 0.0, "overdue": 0.0}},
        {"type": "refund", "amount_range": (-500, -50), "status_weights": {"paid": 1.0, "pending": 0.0, "overdue": 0.0}},
        {"type": "other", "amount_range": (10, 100), "status_weights": {"paid": 0.5, "pending": 0.3, "overdue": 0.2}},
    ]
    
    # Méthodes de paiement
    payment_methods = ["bank_transfer", "credit_card", "cash", "check", ""]
    
    # Créer 50 transactions variées
    created_transactions = []
    for i in range(1, 51):  # 50 transactions
        try:
            # Sélectionner un étudiant aléatoire
            student = created_students[i % len(created_students)]
            
            # Sélectionner un type de transaction
            trans_type = transaction_types[i % len(transaction_types)]
            transaction_type = trans_type["type"]
            
            # Générer un montant
            min_amount, max_amount = trans_type["amount_range"]
            amount = round(random.uniform(min_amount, max_amount), 3)
            if transaction_type in ["scholarship", "refund"]:
                amount = -abs(amount)
            
            # Sélectionner un statut basé sur les poids
            status = random.choices(
                list(trans_type["status_weights"].keys()),
                weights=list(trans_type["status_weights"].values())
            )[0]
            
            # Sélectionner une méthode de paiement
            method = payment_methods[i % len(payment_methods)]
            if status == "paid" and method == "":
                method = random.choice(payment_methods[:-1])
            
            # Sélectionner une date
            transaction_date = dates[i % len(dates)]
            due_date = transaction_date + timedelta(days=30)
            
            # Description
            descriptions = {
                "tuition": f"Frais de scolarité semestre {i % 2 + 1}",
                "exam_fee": f"Frais d'examen {['final', 'partiel', 'rattrapage'][i % 3]}",
                "lab_fee": f"Frais de laboratoire {['chimie', 'physique', 'informatique'][i % 3]}",
                "library_fee": f"Abonnement bibliothèque {['annuel', 'semestriel'][i % 2]}",
                "scholarship": f"Bourse {['excellence', 'sociale', 'sportive'][i % 3]}",
                "refund": f"Remboursement {['inscription', 'matériel', 'activité'][i % 3]}",
                "other": f"Frais {['administratif', 'certificat', 'diplôme'][i % 3]}",
            }
            
            description = f"{descriptions.get(transaction_type, 'Transaction')} - {student.user.get_full_name()}"
            
            # Créer la transaction
            transaction = Transaction.objects.create(
                student=student,
                transaction_type=transaction_type,
                amount=amount,
                date=transaction_date,
                due_date=due_date,
                status=status,
                method=method,
                description=f"{description} (Transaction #{i:03d})"
            )
            
            created_transactions.append(transaction)
            
            # Afficher les 10 premières
            if i <= 10:
                amount_sign = "-" if amount < 0 else "+"
                print(f"   {i:2d}. {amount_sign}{abs(amount):8.3f} TND | "
                      f"{transaction_type:15} | "
                      f"{status:10} | "
                      f"{student.user.get_full_name()}")
        
        except Exception as e:
            print(f"   ❌ Erreur création transaction {i}: {str(e)}")
    
    print(f"\n📊 Total transactions créées: {len(created_transactions)}")
    
    # ================================================================
    # 3. CRÉATION DES BUDGETS
    # ================================================================
    print("\n" + "="*80)
    print("3. CRÉATION DES BUDGETS")
    print("="*80)
    
    # Nettoyer les anciens budgets
    Budget.objects.all().delete()
    print("   ✅ Anciens budgets supprimés")
    
    # Budgets détaillés pour chaque département
    budgets_data = [
        {
            "department": "Faculté d'Ingénierie",
            "years": [2024, 2025, 2026],
            "allocated_range": (80000, 120000),
            "spent_percentage_range": (0.5, 0.8)
        },
        {
            "department": "Faculté de Médecine",
            "years": [2024, 2025, 2026],
            "allocated_range": (100000, 180000),
            "spent_percentage_range": (0.6, 0.9)
        },
        {
            "department": "Faculté des Sciences",
            "years": [2024, 2025, 2026],
            "allocated_range": (60000, 100000),
            "spent_percentage_range": (0.4, 0.7)
        },
        {
            "department": "Faculté des Arts",
            "years": [2024, 2025, 2026],
            "allocated_range": (40000, 80000),
            "spent_percentage_range": (0.3, 0.6)
        },
        {
            "department": "Faculté d'Économie",
            "years": [2024, 2025, 2026],
            "allocated_range": (50000, 90000),
            "spent_percentage_range": (0.5, 0.75)
        },
        {
            "department": "Centre Informatique",
            "years": [2024, 2025, 2026],
            "allocated_range": (70000, 110000),
            "spent_percentage_range": (0.6, 0.85)
        },
        {
            "department": "Bibliothèque Centrale",
            "years": [2024, 2025, 2026],
            "allocated_range": (50000, 90000),
            "spent_percentage_range": (0.4, 0.7)
        },
        {
            "department": "Affaires Étudiantes",
            "years": [2024, 2025, 2026],
            "allocated_range": (30000, 60000),
            "spent_percentage_range": (0.5, 0.8)
        },
    ]
    
    created_budgets = []
    for budget_data in budgets_data:
        department = budget_data["department"]
        for year in budget_data["years"]:
            try:
                # Générer des montants aléatoires dans les plages
                min_allocated, max_allocated = budget_data["allocated_range"]
                allocated = round(random.uniform(min_allocated, max_allocated), 3)
                
                min_spent_percent, max_spent_percent = budget_data["spent_percentage_range"]
                spent_percent = random.uniform(min_spent_percent, max_spent_percent)
                spent = round(allocated * spent_percent, 3)
                
                # Créer le budget
                budget = Budget.objects.create(
                    department=department,
                    year=year,
                    allocated_amount=allocated,
                    spent_amount=spent,
                    description=f"Budget {department} - Année {year} - {['Maintien infrastructure', 'Développement projets', 'Équipements nouveaux'][year % 3]}"
                )
                
                created_budgets.append(budget)
                remaining = allocated - spent
                percent_spent = (spent / allocated) * 100 if allocated > 0 else 0
                
                print(f"   ✅ {department:25} ({year}):")
                print(f"        Alloué: {allocated:12,.3f} TND")
                print(f"        Dépensé: {spent:12,.3f} TND ({percent_spent:.1f}%)")
                print(f"        Restant: {remaining:12,.3f} TND")
                
            except Exception as e:
                print(f"   ❌ Erreur création budget {department} ({year}): {str(e)}")
    
    print(f"\n📊 Total budgets créés: {len(created_budgets)}")
    
    # ================================================================
    # 4. STATISTIQUES ET VÉRIFICATIONS
    # ================================================================
    print("\n" + "="*80)
    print("4. STATISTIQUES FINALES")
    print("="*80)
    
    try:
        # Calcul des statistiques
        total_transactions = Transaction.objects.count()
        
        # Revenus
        paid_transactions = Transaction.objects.filter(status='paid', amount__gt=0)
        total_revenue = paid_transactions.aggregate(total=Sum('amount'))['total'] or 0
        
        # En attente
        pending_transactions = Transaction.objects.filter(status='pending', amount__gt=0)
        pending_amount = pending_transactions.aggregate(total=Sum('amount'))['total'] or 0
        pending_count = pending_transactions.count()
        
        # Retards
        overdue_transactions = Transaction.objects.filter(status='overdue', amount__gt=0)
        overdue_amount = overdue_transactions.aggregate(total=Sum('amount'))['total'] or 0
        overdue_count = overdue_transactions.count()
        
        # Bourses
        scholarships = Transaction.objects.filter(transaction_type='scholarship', status='paid')
        scholarship_amount = abs(scholarships.aggregate(total=Sum('amount'))['total'] or 0)
        scholarship_count = scholarships.count()
        
        # Remboursements
        refunds = Transaction.objects.filter(transaction_type='refund', status='paid')
        refund_amount = abs(refunds.aggregate(total=Sum('amount'))['total'] or 0)
        refund_count = refunds.count()
        
        # Budgets
        total_budgets = Budget.objects.count()
        total_allocated = Budget.objects.aggregate(total=Sum('allocated_amount'))['total'] or 0
        total_spent = Budget.objects.aggregate(total=Sum('spent_amount'))['total'] or 0
        total_remaining = total_allocated - total_spent
        
        print(f"\n📊 TRANSACTIONS:")
        print(f"   • Total: {total_transactions}")
        print(f"   • Revenu total: {total_revenue:,.3f} TND")
        print(f"   • En attente: {pending_amount:,.3f} TND ({pending_count} transactions)")
        print(f"   • Retards: {overdue_amount:,.3f} TND ({overdue_count} transactions)")
        print(f"   • Bourses: {scholarship_amount:,.3f} TND ({scholarship_count} bourses)")
        print(f"   • Remboursements: {refund_amount:,.3f} TND ({refund_count} remboursements)")
        
        print(f"\n💰 BUDGETS:")
        print(f"   • Total budgets: {total_budgets}")
        print(f"   • Total alloué: {total_allocated:,.3f} TND")
        print(f"   • Total dépensé: {total_spent:,.3f} TND")
        print(f"   • Total restant: {total_remaining:,.3f} TND")
        print(f"   • Taux d'utilisation: {(total_spent/total_allocated*100):.1f}%" if total_allocated > 0 else "   • Taux d'utilisation: 0.0%")
        
        # Répartition par type
        print(f"\n📈 RÉPARTITION PAR TYPE:")
        type_stats = Transaction.objects.filter(status='paid').values(
            'transaction_type'
        ).annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        type_translations = {
            'tuition': 'Frais de scolarité',
            'exam_fee': "Frais d'examen",
            'lab_fee': 'Frais de laboratoire',
            'library_fee': 'Frais de bibliothèque',
            'scholarship': 'Bourses',
            'refund': 'Remboursements',
            'other': 'Autres',
        }
        
        for stat in type_stats:
            type_name = type_translations.get(stat['transaction_type'], stat['transaction_type'])
            amount = abs(stat['total'])
            percentage = (amount / abs(total_revenue)) * 100 if total_revenue > 0 else 0
            print(f"   • {type_name:20}: {amount:10,.3f} TND ({percentage:5.1f}%) - {stat['count']} transactions")
        
        # Top 5 étudiants par nombre de transactions
        print(f"\n🏆 TOP 5 ÉTUDIANTS:")
        student_stats = Transaction.objects.values(
            'student__user__first_name',
            'student__user__last_name'
        ).annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-count')[:5]
        
        for i, stat in enumerate(student_stats, 1):
            student_name = f"{stat['student__user__first_name']} {stat['student__user__last_name']}"
            print(f"   {i}. {student_name:25}: {stat['count']:3} transactions, {stat['total']:10,.3f} TND")
            
    except Exception as e:
        print(f"❌ Erreur calcul statistiques: {str(e)}")
    
    print("\n" + "="*80)
    print("✅ CRÉATION DE DONNÉES TERMINÉE AVEC SUCCÈS !")
    print("="*80)
    
    return {
        'students': len(created_students),
        'transactions': len(created_transactions),
        'budgets': len(created_budgets),
    }

def create_simple_test_data():
    """Créer des données de test simples si le script principal échoue"""
    print("\n" + "="*80)
    print("CRÉATION DE DONNÉES DE TEST SIMPLES")
    print("="*80)
    
    try:
        # Créer un super utilisateur admin s'il n'existe pas
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@iteam.edu.tn',
                password='admin123',
                first_name='Admin',
                last_name='System'
            )
            print("✅ Super utilisateur admin créé")
        
        # Créer 5 étudiants de test
        created_students = []
        for i in range(1, 6):
            # Créer ou récupérer l'utilisateur
            user, created = User.objects.get_or_create(
                username=f'test_student_{i}',
                defaults={
                    'email': f'student{i}@iteam.edu.tn',
                    'first_name': f'Prénom{i}',
                    'last_name': f'Nom{i}',
                    'is_active': True
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            
            # Créer ou récupérer l'étudiant AVEC LES BONS CHAMPS
            student, created = Student.objects.get_or_create(
                student_id=f'TEST00{i}',
                defaults={
                    'user': user,
                    'enrollment_date': datetime.now().date() - timedelta(days=200),
                    'faculty': random.choice(["Faculté d'Ingénierie", "Faculté de Médecine", "Faculté des Sciences"]),
                    'department': random.choice(["Informatique", "Médecine", "Mathématiques"]),
                    'current_year': random.randint(1, 5),
                    'gpa': random.uniform(2.0, 4.0),
                    'status': 'active'
                }
            )
            created_students.append(student)
        
        print(f"✅ {len(created_students)} étudiants de test créés")
        
        # Créer 20 transactions de test
        Transaction.objects.all().delete()
        transaction_types = ['tuition', 'exam_fee', 'lab_fee', 'library_fee', 'scholarship', 'refund']
        statuses = ['paid', 'pending', 'overdue']
        
        for i in range(1, 21):
            student = created_students[i % len(created_students)]
            transaction_type = transaction_types[i % len(transaction_types)]
            
            if transaction_type in ['scholarship', 'refund']:
                amount = -random.uniform(100, 500)
            else:
                amount = random.uniform(50, 1000)
            
            Transaction.objects.create(
                student=student,
                transaction_type=transaction_type,
                amount=round(amount, 3),
                date=datetime.now().date() - timedelta(days=random.randint(0, 60)),
                due_date=datetime.now().date() + timedelta(days=random.randint(0, 30)),
                status=statuses[i % len(statuses)],
                method=random.choice(['bank_transfer', 'credit_card', 'cash', '']),
                description=f"Transaction de test #{i}"
            )
        
        print(f"✅ 20 transactions de test créées")
        
        # Créer 3 budgets de test
        Budget.objects.all().delete()
        departments = ["Faculté d'Ingénierie", "Faculté de Médecine", "Centre Informatique"]
        
        for i, dept in enumerate(departments, 1):
            allocated = random.uniform(50000, 150000)
            spent = allocated * random.uniform(0.3, 0.8)
            
            Budget.objects.create(
                department=dept,
                year=2024,
                allocated_amount=round(allocated, 3),
                spent_amount=round(spent, 3),
                description=f"Budget test {dept} 2024"
            )
        
        print(f"✅ {len(departments)} budgets de test créés")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur création données test: {str(e)}")
        return False

if __name__ == "__main__":
    try:
        print("🚀 Démarrage de la création complète de données...")
        
        # 1. Créer toutes les données
        stats = create_all_data()
        
        print("\n" + "="*80)
        print("🎯 RÉSUMÉ CRÉATION DONNÉES")
        print("="*80)
        print(f"   • Étudiants créés: {stats['students']}")
        print(f"   • Transactions créées: {stats['transactions']}")
        print(f"   • Budgets créés: {stats['budgets']}")
        print("="*80)
        
        # Si pas assez de données, créer des données de test
        if stats['students'] < 5 or stats['transactions'] < 10:
            print("\n⚠️ Données insuffisantes. Création de données de test...")
            if create_simple_test_data():
                print("✅ Données de test créées avec succès")
        
        print("\n" + "="*80)
        print("📋 INSTRUCTIONS")
        print("="*80)
        print("\n🎯 ÉTAPES SUIVANTES:")
        print("   1. Redémarrez le serveur Django: python manage.py runserver")
        print("   2. Démarrez le frontend React: npm start")
        print("   3. Accédez à: http://localhost:3000")
        print("   4. Connectez-vous avec: admin / admin123")
        print("\n🔧 POUR TESTER L'API:")
        print("   - http://localhost:8000/api/finance/transactions/")
        print("   - http://localhost:8000/api/finance/budgets/")
        print("   - http://localhost:8000/api/finance/statistics/")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ ERREUR CRITIQUE: {str(e)}")
        
        # Essayer de créer des données de test minimales
        print("\n🔄 Tentative de création de données de test minimales...")
        create_simple_test_data()