"""
Script to drop and recreate all database tables.
Run this after changing primary key types from Integer to String.
"""
from database.db import engine, Base
from models import all_models as models

print("Dropping all existing tables...")
Base.metadata.drop_all(bind=engine)
print("All tables dropped.")

print("Creating all tables with new schema (String primary keys)...")
Base.metadata.create_all(bind=engine)
print("All tables created successfully!")

# List all tables
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nCreated {len(tables)} tables:")
for t in sorted(tables):
    print(f"  - {t}")
