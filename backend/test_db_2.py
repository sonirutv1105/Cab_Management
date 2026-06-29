from database.db import SessionLocal
from models import all_models as models
from validations import all_schemas as schemas
from routes.all_routes import create_driver_draft

db = SessionLocal()
try:
    draft = schemas.DriverDraftCreate(draft_id="test_draft_error", first_name="test")
    res = create_driver_draft(draft, db)
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
