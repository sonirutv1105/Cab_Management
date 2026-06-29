import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.abspath('backend'))

from validations.all_schemas import DriverCreate

schema = DriverCreate.model_json_schema()
print("DriverCreate properties:", schema.get("properties").keys())
print("DriverCreate required:", schema.get("required", []))
