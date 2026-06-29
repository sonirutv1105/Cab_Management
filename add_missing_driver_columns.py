import sys
import os

sys.path.append(os.path.abspath('backend'))

from sqlalchemy import text
from database.db import engine

def add_column_if_not_exists(table, column_name, column_type):
    with engine.connect() as conn:
        try:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column_name} {column_type}"))
            conn.commit()
            print(f"Added {column_name} to {table}")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print(f"Column {column_name} already exists in {table}")
            else:
                print(f"Error adding {column_name} to {table}: {e}")

add_column_if_not_exists("drivers", "email", "VARCHAR(100)")
add_column_if_not_exists("drivers", "selfVehicleModel", "VARCHAR(100)")
add_column_if_not_exists("drivers", "selfVehicleColor", "VARCHAR(50)")

add_column_if_not_exists("driver_drafts", "email", "VARCHAR(100)")
