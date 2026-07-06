import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db import engine
from sqlalchemy import text

def add_columns():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL"))
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expiry VARCHAR(50) NULL"))
            print("Added reset_token columns to users")
        except Exception as e:
            print("Error users:", e)
            
        try:
            conn.execute(text("ALTER TABLE super_admins ADD COLUMN reset_token VARCHAR(255) NULL"))
            conn.execute(text("ALTER TABLE super_admins ADD COLUMN reset_token_expiry VARCHAR(50) NULL"))
            print("Added reset_token columns to super_admins")
        except Exception as e:
            print("Error super_admins:", e)
            
        try:
            conn.execute(text("CREATE INDEX ix_users_reset_token ON users (reset_token)"))
        except Exception:
            pass
            
        try:
            conn.execute(text("CREATE INDEX ix_super_admins_reset_token ON super_admins (reset_token)"))
        except Exception:
            pass

if __name__ == "__main__":
    add_columns()
