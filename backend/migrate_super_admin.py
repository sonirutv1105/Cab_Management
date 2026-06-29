from sqlalchemy import text
from database.db import engine
from models import all_models

# Ensure tables are created if they don't exist
all_models.Base.metadata.create_all(bind=engine)

def alter_table(table_name, column_name, column_type):
    with engine.connect() as conn:
        try:
            # We wrap this in a try-except because there's no "ADD COLUMN IF NOT EXISTS" in standard SQL/MySQL that works simply
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type};"))
            conn.commit()
            print(f"Added {column_name} to {table_name}")
        except Exception as e:
            print(f"Skipped {column_name} on {table_name} (might already exist)")

def run():
    alter_table("users", "status", "VARCHAR(50) DEFAULT 'Active'")
    alter_table("users", "created_at", "VARCHAR(50)")
    
    alter_table("tasks", "due_date", "VARCHAR(50)")
    alter_table("tasks", "comments", "TEXT")
    alter_table("tasks", "attachments", "TEXT")
    
    alter_table("tenders", "tender_number", "VARCHAR(100)")
    alter_table("tenders", "client_name", "VARCHAR(150)")
    alter_table("tenders", "department", "VARCHAR(100)")
    alter_table("tenders", "tender_value", "FLOAT")
    alter_table("tenders", "opening_date", "VARCHAR(50)")
    alter_table("tenders", "closing_date", "VARCHAR(50)")
    alter_table("tenders", "assigned_manager", "VARCHAR(100)")
    alter_table("tenders", "remarks", "TEXT")
    alter_table("tenders", "documents", "TEXT")

if __name__ == "__main__":
    run()
