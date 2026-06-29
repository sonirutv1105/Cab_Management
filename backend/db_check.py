from database.db import engine
from sqlalchemy import inspect

inspector = inspect(engine)
print("Tables found in database:")
for table_name in inspector.get_table_names():
    print(f" - {table_name}")
