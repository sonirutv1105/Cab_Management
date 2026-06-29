import re

def refactor_super_admin():
    file_path = "routes/super_admin.py"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update route path parameters from id: str to id: int
    content = re.sub(r"def (\w+)\(id:\s*str", r"def \1(id: int", content)
    content = re.sub(r"def (\w+)\(company_id:\s*str", r"def \1(company_id: int", content)

    # Replace id: str to id: int anywhere else in signatures if applicable
    content = re.sub(r"id:\s*str", r"id: int", content)

    # 2. Remove uuid.uuid4() explicit assignments in SQLAlchemy model instantiation
    content = re.sub(r"id=f\"cmp_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"usr_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"sub_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"rol_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    content = re.sub(r"id=f\"prm_\{uuid\.uuid4\(\)\.hex\[:8\]\}\",\s*", "", content)
    
    # Sometimes it's just id=str(uuid.uuid4())
    content = re.sub(r"id=str\(uuid\.uuid4\(\)\),\s*", "", content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Refactored super_admin.py successfully.")

if __name__ == "__main__":
    refactor_super_admin()
