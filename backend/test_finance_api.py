import os
import sys
import django
import sqlite3
from pathlib import Path
import uuid

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'university_management.settings')
django.setup()

from django.db import connection

def fix_finance_database():
    print("🔧 Réparation de la base de données finance...")
    
    db_path = BASE_DIR / 'db.sqlite3'
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # 1. Vérifier la structure actuelle
        cursor.execute("PRAGMA table_info(finance_transaction)")
        columns = {col[1]: col for col in cursor.fetchall()}
        print(f"Colonnes actuelles: {list(columns.keys())}")
        
        # 2. Ajouter transaction_number si manquant
        if 'transaction_number' not in columns:
            print("➕ Ajout de transaction_number...")
            cursor.execute("""
                ALTER TABLE finance_transaction 
                ADD COLUMN transaction_number VARCHAR(50)
            """)
            
            # Générer des numéros uniques
            cursor.execute("SELECT id FROM finance_transaction")
            transactions = cursor.fetchall()
            
            for i, (trans_id,) in enumerate(transactions):
                trans_number = f"TRN24{i+1:06d}"
                cursor.execute(
                    "UPDATE finance_transaction SET transaction_number = ? WHERE id = ?",
                    (trans_number, trans_id)
                )
            
            # Ajouter index unique
            cursor.execute("""
                CREATE UNIQUE INDEX idx_finance_transaction_number 
                ON finance_transaction(transaction_number)
            """)
            print(f"✓ {len(transactions)} transactions mises à jour")
        
        # 3. Ajouter teacher_id si manquant
        if 'teacher_id' not in columns:
            print("➕ Ajout de teacher_id...")
            cursor.execute("""
                ALTER TABLE finance_transaction 
                ADD COLUMN teacher_id VARCHAR(36) REFERENCES teachers_teacher(id)
            """)
            print("✓ Colonne teacher_id ajoutée")
        
        # 4. Ajouter paid_amount avec valeur par défaut
        if 'paid_amount' not in columns:
            print("➕ Ajout de paid_amount...")
            cursor.execute("""
                ALTER TABLE finance_transaction 
                ADD COLUMN paid_amount NUMERIC(12, 3) DEFAULT 0
            """)
            print("✓ Colonne paid_amount ajoutée")
        
        # 5. Vérifier les types de données
        if columns.get('student_id') and columns['student_id'][2] == 'INTEGER':
            print("⚠️ student_id est INTEGER, conversion en UUID...")
            
            # Créer une table temporaire avec la structure correcte
            cursor.execute("""
                CREATE TABLE finance_transaction_new (
                    id VARCHAR(36) PRIMARY KEY,
                    transaction_number VARCHAR(50) UNIQUE,
                    student_id VARCHAR(36) REFERENCES students_student(id),
                    teacher_id VARCHAR(36) REFERENCES teachers_teacher(id),
                    transaction_type VARCHAR(20),
                    amount NUMERIC(12, 3),
                    paid_amount NUMERIC(12, 3) DEFAULT 0,
                    date DATE,
                    due_date DATE,
                    status VARCHAR(20),
                    method VARCHAR(20),
                    description TEXT,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """)
            
            # Copier les données existantes
            cursor.execute("SELECT * FROM finance_transaction")
            old_data = cursor.fetchall()
            
            for row in old_data:
                new_id = str(uuid.uuid4()) if not isinstance(row[0], str) or '-' not in row[0] else row[0]
                
                cursor.execute("""
                    INSERT INTO finance_transaction_new 
                    (id, transaction_type, amount, date, due_date, status, method, description, student_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    new_id, row[1], row[2], row[3], row[4], row[5], row[6], row[7], 
                    str(row[8]) if row[8] else None
                ))
            
            # Remplacer l'ancienne table
            cursor.execute("DROP TABLE finance_transaction")
            cursor.execute("ALTER TABLE finance_transaction_new RENAME TO finance_transaction")
            print("✓ Structure de la table corrigée")
        
        conn.commit()
        print("✅ Base de données réparée avec succès!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == '__main__':
    fix_finance_database()