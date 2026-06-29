import pymysql
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db import Base, engine
from models import all_models

def recreate():
    print("Dropping and recreating the MySQL database...")
    conn = pymysql.connect(host='localhost', user='root', password='')
    cursor = conn.cursor()
    cursor.execute("DROP DATABASE IF EXISTS cab_management;")
    cursor.execute("CREATE DATABASE cab_management;")
    conn.commit()
    conn.close()

    print("Creating all tables from scratch...")
    Base.metadata.create_all(bind=engine)
    print("Database recreated successfully.")

if __name__ == "__main__":
    recreate()
