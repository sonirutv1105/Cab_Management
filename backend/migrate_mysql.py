from database.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE driver_drafts ADD COLUMN current_step INT DEFAULT 1;"))
        conn.commit()
        print("Column current_step added successfully.")
    except Exception as e:
        print("Error altering table:", str(e))
