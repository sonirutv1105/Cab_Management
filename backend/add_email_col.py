from sqlalchemy import create_engine, text

def migrate():
    engine = create_engine('mysql+pymysql://root:@localhost:3306/cab_management')
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE drivers ADD COLUMN email VARCHAR(100) NULL;"))
            print("Added email to drivers table")
        except Exception as e:
            print(f"Error adding to drivers: {e}")
            
        try:
            conn.execute(text("ALTER TABLE driver_drafts ADD COLUMN email VARCHAR(100) NULL;"))
            print("Added email to driver_drafts table")
        except Exception as e:
            print(f"Error adding to driver_drafts: {e}")
            
        conn.commit()

if __name__ == "__main__":
    migrate()
