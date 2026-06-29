import pymysql

conn = pymysql.connect(host='localhost', user='root', password='', database='cab_management')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE drivers ADD COLUMN vehicleAssignmentType VARCHAR(50);")
    print("Added vehicleAssignmentType to drivers")
except Exception as e:
    print(e)

conn.commit()
conn.close()
