from database.db import SessionLocal
from models.all_models import User, SuperAdmin

def list_users():
    db = SessionLocal()
    try:
        print("--- SUPER ADMINS ---")
        sas = db.query(SuperAdmin).all()
        for sa in sas:
            print(f"ID: {sa.id}, Name: {sa.name}, Email: {sa.email}, Role: {sa.role}")
        
        print("\n--- USERS ---")
        users = db.query(User).all()
        for u in users:
            print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
