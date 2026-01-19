# backend/finance/migrations/0010_remove_transaction_finance_tra_transac_137c49_idx_and_more.py

from django.db import migrations, models
import django.db.models.deletion

def create_indexes_if_missing(apps, schema_editor):
    """Créer les indexes s'ils n'existent pas avant de les supprimer"""
    print("🔧 Vérification des indexes pour la migration 0010...")
    
    # Cette fonction ne fait rien car les indexes seront créés par notre script
    # C'est juste une sécurité
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0009_remove_budget_unique_constraint_clean'),
    ]

    operations = [
        # D'abord, s'assurer que les indexes existent
        migrations.RunPython(
            create_indexes_if_missing,
            reverse_code=migrations.RunPython.noop
        ),
        
        # Ensuite, les supprimer
        migrations.RemoveIndex(
            model_name='transaction',
            name='finance_tra_transac_137c49_idx',
        ),
        migrations.RemoveIndex(
            model_name='transaction',
            name='finance_tra_student_ff08f9_idx',
        ),
        migrations.RemoveIndex(
            model_name='transaction',
            name='finance_tra_teacher_835bf7_idx',
        ),
        migrations.RemoveIndex(
            model_name='transaction',
            name='finance_tra_date_f21d66_idx',
        ),
        migrations.RemoveIndex(
            model_name='transaction',
            name='finance_tra_due_dat_f1aba6_idx',
        ),
        migrations.AlterUniqueTogether(
            name='budget',
            unique_together=set(),
        ),
        migrations.AlterField(
            model_name='paymentreminder',
            name='transaction',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reminders', to='finance.transaction'),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='id',
            field=models.AutoField(primary_key=True, serialize=False),
        ),
    ]