import sys
import os

# Add the backend directory to python path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db import SessionLocal
from models.all_models import Contract, ContractDraft

def fetch_data():
    print("Attempting to connect to remote database...")
    try:
        db = SessionLocal()
        
        contracts = db.query(Contract).all()
        print(f"\n--- Fetched {len(contracts)} Contracts from Remote DB ---")
        for c in contracts:
            print(f"[{c.id}] Number: {c.contractNumber} | Title: {c.title} | Status: {c.status}")
            
        drafts = db.query(ContractDraft).all()
        print(f"\n--- Fetched {len(drafts)} Drafts from Remote DB ---")
        for d in drafts:
            print(f"[{d.draft_id}] Title: {d.title} | Contract ID: {d.contract_id}")
            
        db.close()
        print("\nData fetch complete.")
    except Exception as e:
        print(f"Error connecting to remote database: {e}")

if __name__ == "__main__":
    fetch_data()
