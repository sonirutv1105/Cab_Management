import sys
import os

sys.path.append(os.path.abspath('backend'))

from validations.all_schemas import DriverDraftCreate

schema = DriverDraftCreate.model_json_schema()
print("DriverDraftCreate properties:", schema.get("properties").keys())
