import sqlite3

def upgrade():
    conn = sqlite3.connect('cms.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE driver_drafts ADD COLUMN current_step INTEGER DEFAULT 1;")
        print("Successfully added current_step column to driver_drafts table.")
    except sqlite3.OperationalError as e:
        print(f"Error (column might already exist): {e}")
    finally:
        conn.commit()
        conn.close()

if __name__ == "__main__":
    upgrade()
