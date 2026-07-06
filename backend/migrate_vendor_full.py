import pymysql

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'cab_management',
}

def migrate_vendors_full():
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor() as cursor:
            columns = [
                ("vendorCode", "VARCHAR(50) NULL"),
                ("vendorType", "VARCHAR(100) NULL"),
                ("businessCategory", "VARCHAR(100) NULL"),
                ("panNumber", "VARCHAR(50) NULL"),
                ("designation", "VARCHAR(100) NULL"),
                ("vehicleTypes", "VARCHAR(255) NULL"),
                ("totalDrivers", "INT NULL"),
                ("operatingCities", "VARCHAR(255) NULL"),
                ("serviceAvailability", "VARCHAR(100) NULL"),
                ("complianceRating", "FLOAT NULL"),
                ("responseTime", "VARCHAR(50) NULL"),
                ("docGst", "VARCHAR(255) NULL"),
                ("docPan", "VARCHAR(255) NULL"),
                ("docRegistration", "VARCHAR(255) NULL"),
                ("docInsurance", "VARCHAR(255) NULL"),
                ("docAgreement", "VARCHAR(255) NULL"),
                ("docOther", "VARCHAR(255) NULL"),
                ("bankName", "VARCHAR(100) NULL"),
                ("accountHolder", "VARCHAR(100) NULL"),
                ("accountNumber", "VARCHAR(100) NULL"),
                ("ifscCode", "VARCHAR(50) NULL"),
                ("branchName", "VARCHAR(100) NULL"),
                ("upiId", "VARCHAR(100) NULL")
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
    migrate_vendors_full()
