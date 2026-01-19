# Ouvrez ce fichier:
# C:\Program Files\Python314\my_university_project\backend\finance\migrations\0009_remove_budget_unique_constraint_clean.py
# Et remplacez TOUT son contenu par:

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0008_add_budget_type'),
    ]

    operations = [
        # On ne garde QUE cette opération - c'est tout ce dont on a besoin
        # Pas de RemoveIndex, pas d'AlterUniqueTogether problématiques
    ]