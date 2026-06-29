import traceback
from database.db import SessionLocal
from routes.all_routes import convert_driver_draft
db = SessionLocal()
try:
    convert_driver_draft('drv_draft_037d499a', db)
    print("Success")
except Exception as e:
    print("ERROR:")
    print(traceback.format_exc())
