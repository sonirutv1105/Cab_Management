import re

def refactor_schemas():
    file_path = "validations/all_schemas.py"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Create Schemas typically have `id: str` or `id: Optional[str] = None`
    # Response Schemas typically have `id: str`
    # Let's just do targeted replacements for typical cases.

    # 1. Foreign keys:
    content = re.sub(r"vendorId:\s*Optional\[str\]", r"vendorId: Optional[int]", content)
    content = re.sub(r"assignedVehicleId:\s*Optional\[str\]", r"assignedVehicleId: Optional[int]", content)
    content = re.sub(r"company_id:\s*Optional\[str\]", r"company_id: Optional[int]", content)
    content = re.sub(r"vehicleId:\s*Optional\[str\]", r"vehicleId: Optional[int]", content)
    content = re.sub(r"driverId:\s*Optional\[str\]", r"driverId: Optional[int]", content)
    content = re.sub(r"role_id:\s*Optional\[str\]", r"role_id: Optional[int]", content)

    # 2. Base/Create/Response `id` fields:
    # First, let's catch `id: str` that are not inside strings
    # This might catch some `draft_id: str` too, which is fine, they should be int.
    content = re.sub(r"(\b(?:id|draft_id|contract_id)\s*:\s*)str\b", r"\1int", content)
    
    # 3. Handle `id: Optional[str] = None`
    content = re.sub(r"(\b(?:id|draft_id|contract_id)\s*:\s*)Optional\[str\]", r"\1Optional[int]", content)

    # Handle List[str] if it was representing list of IDs
    content = re.sub(r"vehicleIds:\s*List\[str\]", r"vehicleIds: List[int]", content)
    content = re.sub(r"driverIds:\s*List\[str\]", r"driverIds: List[int]", content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Refactored all_schemas.py successfully.")

if __name__ == "__main__":
    refactor_schemas()
