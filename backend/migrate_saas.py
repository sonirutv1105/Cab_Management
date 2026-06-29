from sqlalchemy import text, inspect
from database.db import engine

def migrate_saas():
    # Use SQLAlchemy inspector to get all tables in MySQL
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    skip_tables = ['companies', 'subscriptions', 'roles', 'permissions']

    with engine.begin() as conn:
        for table in tables:
            if table in skip_tables:
                continue
            
            columns = [col['name'] for col in inspector.get_columns(table)]
            if 'company_id' not in columns:
                print(f"Adding company_id to {table}...")
                try:
                    conn.execute(text(f"ALTER TABLE `{table}` ADD COLUMN company_id VARCHAR(100) NULL;"))
                    conn.execute(text(f"CREATE INDEX `ix_{table}_company_id` ON `{table}` (company_id);"))
                except Exception as e:
                    print(f"Error on {table}: {e}")
            else:
                print(f"Table {table} already has company_id.")

    print("Migration Step 1 (company_id injection via MySQL) completed.")

if __name__ == "__main__":
    migrate_saas()
