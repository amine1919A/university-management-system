# backend/finance/migrations/0008_add_budget_type.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('finance', '0007_alter_transaction_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='budget',
            name='budget_type',
            field=models.CharField(
                choices=[
                    ('operational', 'Opérationnel'),
                    ('capital', 'Capital'),
                    ('salary', 'Salaires'),
                    ('scholarship', 'Bourses'),
                    ('development', 'Développement')
                ],
                default='operational',
                max_length=20
            ),
        ),
    ]