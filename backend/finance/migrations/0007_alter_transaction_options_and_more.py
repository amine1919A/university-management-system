# finance/migrations/0007_alter_transaction_options_and_more.py

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0006_fix_created_at'),
    ]

    operations = [
    migrations.AlterModelOptions(
        name='transaction',
        options={'ordering': ['-date']},
    ),
    migrations.AlterField(
        model_name='transaction',
        name='student',
        field=models.ForeignKey(blank=True, db_column='student_id', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to='students.student'),
    ),
    migrations.AlterField(
        model_name='transaction',
        name='transaction_number',
        field=models.CharField(blank=True, max_length=50, null=True, unique=True),
    ),
]