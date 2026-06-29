import pymysql

conn = pymysql.connect(host='localhost', user='root', password='', database='cab_management')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE driver_drafts ADD COLUMN self_vehicle_model VARCHAR(100);")
    print("Added self_vehicle_model to driver_drafts")
except Exception as e:
    print(e)
    
try:
    cursor.execute("ALTER TABLE driver_drafts ADD COLUMN self_vehicle_color VARCHAR(50);")
    print("Added self_vehicle_color to driver_drafts")
except Exception as e:
    print(e)

conn.commit()
conn.close()
