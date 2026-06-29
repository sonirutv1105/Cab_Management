import pymysql

try:
    # Connect to MySQL server without specifying a database
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        port=3306
    )
    
    with connection.cursor() as cursor:
        cursor.execute("CREATE DATABASE IF NOT EXISTS cab_management;")
        print("Database 'cab_management' created or already exists.")
        
    connection.commit()
    connection.close()
except Exception as e:
    print(f"Failed to create database: {e}")
