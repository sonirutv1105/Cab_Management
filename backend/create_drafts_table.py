from database.db import engine, Base
from models.all_models import ContractDraft

if __name__ == "__main__":
    print("Creating contract_drafts table...")
    ContractDraft.__table__.create(bind=engine, checkfirst=True)
    print("Done.")
