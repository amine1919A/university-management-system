# backend/create_missing_indexes.py
import django
import os
import sys

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'university_management.settings')
django.setup()

from django.db import connection

def create_missing_indexes():
    """Créer les indexes manquants avant que la migration essaie de les supprimer"""
    print("🔧 Création des indexes manquants pour la table finance_transaction...")
    
    try:
        with connection.cursor() as cursor:
            # Liste des indexes que la migration essaie de supprimer
            indexes_to_create = [
                {
                    'name': 'finance_tra_transac_137c49_idx',
                    'sql': 'CREATE INDEX IF NOT EXISTS finance_tra_transac_137c49_idx ON finance_transaction(transaction_number)'
                },
                {
                    'name': 'finance_tra_student_ff08f9_idx',
                    'sql': 'CREATE INDEX IF NOT EXISTS finance_tra_student_ff08f9_idx ON finance_transaction(student_id, status)'
                },
                {
                    'name': 'finance_tra_teacher_835bf7_idx',
                    'sql': 'CREATE INDEX IF NOT EXISTS finance_tra_teacher_835bf7_idx ON finance_transaction(teacher_id)'
                },
                {
                    'name': 'finance_tra_date_f21d66_idx',
                    'sql': 'CREATE INDEX IF NOT EXISTS finance_tra_date_f21d66_idx ON finance_transaction(date)'
                },
                {
                    'name': 'finance_tra_due_dat_f1aba6_idx',
                    'sql': 'CREATE INDEX IF NOT EXISTS finance_tra_due_dat_f1aba6_idx ON finance_transaction(due_date)'
                }
            ]
            
            for index in indexes_to_create:
                try:
                    cursor.execute(index['sql'])
                    print(f"✅ Index créé: {index['name']}")
                except Exception as e:
                    print(f"⚠️ Erreur création index {index['name']}: {e}")
        
        print("✅ Tous les indexes ont été créés avec succès!")
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    create_missing_indexes()