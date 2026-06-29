from database.db import SessionLocal
from models.all_models import SuperAdmin, Company, User
from utils.security import get_password_hash
import datetime

def seed():
    db = SessionLocal()
    try:
        # Create Super Admin
        sa = SuperAdmin(
            name="System Admin",
            email="admin@superadmin.com",
            hashed_password=get_password_hash("admin123"),
            role="super_admin",
            created_at=datetime.datetime.now().isoformat()
        )
        db.add(sa)
        
        # Create Test Company
        cmp = Company(
            name="Test Company",
            code="TEST001",
            company_type="Corporate",
            domain="testcompany.com",
            head_email="head@testcompany.com",
            status="Active"
        )
        db.add(cmp)
        db.commit()
        db.refresh(cmp)
        
        # Create Company Head User
        user = User(
            name="Company Head",
            email="head@testcompany.com",
            hashed_password=get_password_hash("password123"),
            role="Company Head",
            company_id=cmp.id,
            companyName=cmp.name,
            status="Active"
        )
        db.add(user)
        db.commit()
        
        print("Seeded basic test data successfully.")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed()
