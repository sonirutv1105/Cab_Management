import pymysql

# Update these details based on your config.json / environment.
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'cab_management',
}

def migrate_vendors():
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor() as cursor:
            # Add columns if they don't exist
            columns = [
                ("altPhone", "VARCHAR(20) NULL"),
                ("address", "VARCHAR(255) NULL"),
                ("city", "VARCHAR(100) NULL"),
                ("state", "VARCHAR(100) NULL"),
                ("country", "VARCHAR(100) NULL"),
                ("pinCode", "VARCHAR(20) NULL"),
                ("website", "VARCHAR(255) NULL"),
                ("gstNumber", "VARCHAR(50) NULL")
            ]
            
            for col_name, col_type in columns:
                try:
                    cursor.execute(f"ALTER TABLE vendors ADD COLUMN {col_name} {col_type}")
                    print(f"Added column {col_name}")
                except Exception as e:
                    if 'Duplicate column name' in str(e):
                        print(f"Column {col_name} already exists.")
                    else:
                        print(f"Error adding {col_name}: {e}")
                        
        connection.commit()
        print("Migration successful.")
    except Exception as e:
        print("Database connection error:", e)

if __name__ == "__main__":
    migrate_vendors()
