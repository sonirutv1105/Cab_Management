from database.db import SessionLocal
from models.all_models import SuperAdmin
from utils.security import get_password_hash

def reset():
    db = SessionLocal()
    try:
        sa = db.query(SuperAdmin).filter(SuperAdmin.email == 'admin@superadmin.com').first()
        if sa:
            sa.hashed_password = get_password_hash('admin123')
            db.commit()
            print("Password for admin@superadmin.com set to 'admin123'")
        else:
            print("admin@superadmin.com not found")
    finally:
        db.close()

if __name__ == "__main__":
    reset()
