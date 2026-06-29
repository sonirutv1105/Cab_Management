from database.db import engine, Base
from models.all_models import DriverDraft

if __name__ == "__main__":
    print("Creating driver_drafts table...")
    DriverDraft.__table__.create(bind=engine, checkfirst=True)
    print("Done.")
