# convert_committed_amount.py
import sqlite3
import os

DB_PATH = 'db.sqlite3'

if not os.path.exists(DB_PATH):
    print(f"❌ Base de données non trouvée: {DB_PATH}")
    exit()

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("=== CONVERSION DE LA COLONNE committed_amount ===")

# 1. Sauvegarder la table
print("\n1. Sauvegarde de la table...")
cursor.execute("DROP TABLE IF EXISTS finance_budget_old")
cursor.execute("CREATE TABLE finance_budget_old AS SELECT * FROM finance_budget")
print("✅ Table sauvegardée dans finance_budget_old")

# 2. Vérifier la structure actuelle
print("\n2. Structure actuelle:")
cursor.execute("PRAGMA table_info(finance_budget)")
columns = cursor.fetchall()
for col in columns:
    print(f"  {col[0]}. {col[1]:20} {col[2]:15}")

# 3. Créer une nouvelle table avec les bons types
print("\n3. Création de la nouvelle table...")
cursor.execute("DROP TABLE IF EXISTS finance_budget_new")
cursor.execute("""
    CREATE TABLE finance_budget_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department VARCHAR(50) NOT NULL,
        budget_type VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        allocated_amount REAL NOT NULL,
        spent_amount REAL DEFAULT 0,
        committed_amount REAL DEFAULT 0,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME,
        updated_at DATETIME
    )
""")

# 4. Copier les données en convertissant committed_amount
print("\n4. Copie et conversion des données...")
cursor.execute("""
    INSERT INTO finance_budget_new 
    (id, department, budget_type, year, allocated_amount, spent_amount, 
     committed_amount, description, is_active, created_at, updated_at)
    SELECT 
        id,
        department,
        COALESCE(budget_type, 'operational'),
        COALESCE(year, 2024),
        CASE 
            WHEN typeof(allocated_amount) = 'real' THEN allocated_amount
            WHEN allocated_amount = '' OR allocated_amount IS NULL THEN 0.0
            ELSE CAST(allocated_amount AS REAL)
        END,
        CASE 
            WHEN typeof(spent_amount) = 'real' THEN spent_amount
            WHEN spent_amount = '' OR spent_amount IS NULL THEN 0.0
            ELSE CAST(spent_amount AS REAL)
        END,
        CASE 
            WHEN typeof(committed_amount) = 'real' THEN committed_amount
            WHEN committed_amount = '' OR committed_amount IS NULL OR committed_amount = 'committed_amount' THEN 0.0
            ELSE CAST(committed_amount AS REAL)
        END,
        COALESCE(description, ''),
        COALESCE(is_active, 1),
        created_at,
        updated_at
    FROM finance_budget_old
    ORDER BY id
""")

rows_copied = cursor.rowcount
print(f"✅ {rows_copied} lignes copiées et converties")

# 5. Remplacer l'ancienne table
print("\n5. Remplacement de la table...")
cursor.execute("DROP TABLE finance_budget")
cursor.execute("ALTER TABLE finance_budget_new RENAME TO finance_budget")
print("✅ Nouvelle table activée")

# 6. Vérification finale
print("\n6. Vérification finale...")
cursor.execute("PRAGMA table_info(finance_budget)")
new_columns = cursor.fetchall()
print("\nNouvelle structure:")
for col in new_columns:
    print(f"  {col[0]}. {col[1]:20} {col[2]:15}")

# Vérifier les types
cursor.execute("""
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN typeof(allocated_amount) = 'real' THEN 1 ELSE 0 END) as good_allocated,
        SUM(CASE WHEN typeof(spent_amount) = 'real' THEN 1 ELSE 0 END) as good_spent,
        SUM(CASE WHEN typeof(committed_amount) = 'real' THEN 1 ELSE 0 END) as good_committed
    FROM finance_budget
""")
stats = cursor.fetchone()
print(f"\nTypes des colonnes:")
print(f"  allocated_amount: {stats[1]}/{stats[0]} REAL")
print(f"  spent_amount: {stats[2]}/{stats[0]} REAL")
print(f"  committed_amount: {stats[3]}/{stats[0]} REAL")

# Afficher un exemple
cursor.execute("SELECT id, department, allocated_amount, spent_amount, committed_amount FROM finance_budget LIMIT 3")
samples = cursor.fetchall()
print(f"\nExemples de données:")
for sample in samples:
    print(f"  Budget {sample[0]} ({sample[1]}):")
    print(f"    allocated: {sample[2]} (type: {type(sample[2])})")
    print(f"    spent: {sample[3]} (type: {type(sample[3])})")
    print(f"    committed: {sample[4]} (type: {type(sample[4])})")

conn.commit()
conn.close()

print("\n=== CONVERSION TERMINÉE ===")
print("\n✅ La colonne committed_amount est maintenant de type REAL!")
print("📊 Redémarrez le serveur Django et testez l'API.")