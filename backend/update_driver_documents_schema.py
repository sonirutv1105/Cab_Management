import sqlite3
import os

def update_schema():
    db_path = "cms.db"
    
    if not os.path.exists(db_path):
        print("Database file not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("issue_date", "VARCHAR(50)"),
        ("file_name", "VARCHAR(255)"),
        ("file_extension", "VARCHAR(10)"),
        ("file_size", "INTEGER"),
        ("verified_by", "VARCHAR(100)"),
        ("verified_at", "VARCHAR(50)"),
        ("remarks", "VARCHAR(500)"),
        ("is_active", "BOOLEAN DEFAULT 1"),
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE driver_documents ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
