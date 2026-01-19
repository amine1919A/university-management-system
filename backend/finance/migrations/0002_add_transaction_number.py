# finance/migrations/0002_add_transaction_number.py
from django.db import migrations, models
import uuid
import random

def generate_transaction_number(apps, schema_editor):
    Transaction = apps.get_model('finance', 'Transaction')
    
    for transaction in Transaction.objects.all():
        # Générer un numéro pour les transactions existantes
        prefix = 'TRN'
        year = transaction.date.year if transaction.date else 2024
        random_num = str(random.randint(100000, 999999))
        transaction.transaction_number = f"{prefix}{str(year)[-2:]}{random_num}"
        transaction.save()

class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='transaction_number',
            field=models.CharField(max_length=50, unique=True, null=True, blank=True),
        ),
        migrations.RunPython(generate_transaction_number),
        migrations.AlterField(
            model_name='transaction',
            name='transaction_number',
            field=models.CharField(max_length=50, unique=True, blank=True),
        ),
    ]