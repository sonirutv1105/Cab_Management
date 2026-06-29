from database.db import SessionLocal
from models.all_models import User
from utils.security import get_password_hash

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == "om@gmail.com").first()
    if user:
        user.hashed_password = get_password_hash("password123")
        db.commit()
        print(f"Successfully reset password for {user.email} (Role: {user.role}, Company ID: {user.company_id}) to 'password123'")
    else:
        print("User not found!")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
