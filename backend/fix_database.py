# fix_database.py
import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

print("1. Vérification de la structure de la table...")
cursor.execute("PRAGMA table_info(finance_transaction);")
columns = cursor.fetchall()
print("Colonnes de finance_transaction:")
for col in columns:
    print(f"  {col}")

print("\n2. Vérification du type de la colonne 'id'...")
for col in columns:
    if col[1] == 'id':
        print(f"  Type actuel de 'id': {col[2]}")
        if col[2] != 'char' and col[2] != 'varchar' and col[2] != 'text':
            print("  ❌ Le type n'est pas texte (UUID nécessite texte)")
            break

print("\n3. Correction possible...")
# Si id est numérique, nous devons le convertir
cursor.execute("SELECT COUNT(*) FROM finance_transaction;")
count = cursor.fetchone()[0]
print(f"  Nombre de transactions: {count}")

if count == 0:
    print("  ✓ Table vide, nous pouvons la recréer")
    cursor.execute("DROP TABLE IF EXISTS finance_transaction;")
    conn.commit()
    print("  Table supprimée")
else:
    print("  ⚠️ Table non vide, sauvegarde nécessaire")

conn.close()