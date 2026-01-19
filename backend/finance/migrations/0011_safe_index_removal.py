# backend/finance/migrations/0011_safe_index_removal.py
from django.db import migrations

def handle_indexes_safely(apps, schema_editor):
    """Gérer les indexes de manière sécurisée"""
    print("🔧 Suppression sécurisée des indexes...")
    
    # Liste des indexes à supprimer
    indexes_to_remove = [
        'finance_tra_transac_137c49_idx',
        'finance_tra_student_ff08f9_idx',
        'finance_tra_teacher_835bf7_idx',
        'finance_tra_date_f21d66_idx',
        'finance_tra_due_dat_f1aba6_idx'
    ]
    
    for index_name in indexes_to_remove:
        try:
            # Essayer de supprimer l'index s'il existe
            schema_editor.execute(f'DROP INDEX IF EXISTS {index_name}')
            print(f"✅ Index supprimé: {index_name}")
        except Exception as e:
            print(f"⚠️ Index {index_name} non trouvé ou déjà supprimé: {e}")

class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0010_remove_transaction_finance_tra_transac_137c49_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(
            handle_indexes_safely,
            reverse_code=migrations.RunPython.noop
        ),
    ]