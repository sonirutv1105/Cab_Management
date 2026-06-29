from database.db import SessionLocal
from models.all_models import Company, Subscription, User
from routes.super_admin import CompanyCreate, create_company
import sys

db = SessionLocal()
try:
    print("Testing create_company...")
    # Create fake request payload
    company_data = CompanyCreate(
        name="Test Company LLC",
        company_type="Corporate",
        industry="Tech",
        gst_number="123GST",
        pan_number="ABCDE1234F",
        registration_number="REG123",
        head_name="Company Head Test",
        head_email="head_test@testcompany.com",
        head_phone="1234567890",
        plan="Enterprise",
        billing_cycle="Annually"
    )
    res = create_company(company_data, db)
    print("Success response:", res)
    # Check what was saved in the db
    print("Checking db tables:")
    saved_company = db.query(Company).filter(Company.name == "Test Company LLC").first()
    if saved_company:
        print(f"Company saved: ID={saved_company.id}, Name={saved_company.name}, Code={saved_company.code}")
        # Find subscriptions
        saved_subs = db.query(Subscription).filter(Subscription.company_id == saved_company.id).all()
        print(f"Subscriptions associated: {[s.id for s in saved_subs]}")
        # Find users
        saved_users = db.query(User).filter(User.company_id == saved_company.id).all()
        print(f"Users associated: {[(u.id, u.name, u.email, u.role) for u in saved_users]}")
        
        # Now clean up
        db.delete(saved_company)
        for s in saved_subs:
            db.delete(s)
        for u in saved_users:
            db.delete(u)
        db.commit()
        print("Cleaned up successfully.")
    else:
        print("Company not found in DB!")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
