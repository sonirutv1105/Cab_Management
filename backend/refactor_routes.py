import re

def refactor_routes():
    file_path = "routes/all_routes.py"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update route path parameters from id: str to id: int
    content = re.sub(r"def (\w+)\(id:\s*str", r"def \1(id: int", content)
    content = re.sub(r"@(\w+)\.get\(\"/\{id\}\"(?:,\s*response_model=\w+)?\)\n\s*def\s+\w+\(id:\s*str", lambda m: m.group(0).replace("str", "int"), content)

    # 2. Remove uuid.uuid4() explicit assignments in SQLAlchemy model instantiation
    content = re.sub(r"id=user\.id or str\(uuid\.uuid4\(\)\),\s*", "", content)
    content = re.sub(r"id=f\"usr_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"cb_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"cc_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"cf_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"co_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"cv_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"cs_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"cr_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    
    # In sync_driver: new_v_id = str(uuid.uuid4())
    content = re.sub(r"new_v_id\s*=\s*str\(uuid\.uuid4\(\)\)", "new_v_id = None  # let DB auto increment", content)
    # driver_id = str(uuid.uuid4())
    content = re.sub(r"driver_id\s*=\s*str\(uuid\.uuid4\(\)\)", "driver_id = None  # let DB auto increment", content)
    
    # Contract models dynamically generated ID logic
    # db_item = ModelClass(id=contract_id if ModelClass == models.Contract else f"{ModelClass.__tablename__}_{uuid.uuid4().hex[:8]}")
    content = re.sub(
        r"db_item = ModelClass\(id=contract_id if ModelClass == models\.Contract else f\"\{ModelClass\.__tablename__\}_\{uuid\.uuid4\(\)\.hex\[:8\]\}\"\)",
        r"db_item = ModelClass(id=contract_id) if ModelClass == models.Contract else ModelClass()",
        content
    )
    
    # File naming: f"{uuid.uuid4().hex}{ext}" -> keep it, since files need unique names.
    
    # assignedDriverId=driver_dict.get('id', str(uuid.uuid4()))
    content = re.sub(
        r"assignedDriverId=driver_dict\.get\('id',\s*str\(uuid\.uuid4\(\)\)\)",
        r"assignedDriverId=driver_dict.get('id')",
        content
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Refactored all_routes.py successfully.")

if __name__ == "__main__":
    refactor_routes()
