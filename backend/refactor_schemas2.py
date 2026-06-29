import re

def refactor_schemas2():
    file_path = "validations/all_schemas.py"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = {
        r"contractId:\s*str": "contractId: int",
        r"vehicleId:\s*str": "vehicleId: int",
        r"userId:\s*str": "userId: int",
        r"entityId:\s*str": "entityId: int",
        r"driver_id:\s*str": "driver_id: int",
        r"vendorId:\s*str": "vendorId: int",
        r"driverId:\s*str": "driverId: int",
        r"contractId:\s*Optional\[str\]": "contractId: Optional[int]",
        r"vehicleId:\s*Optional\[str\]": "vehicleId: Optional[int]",
        r"userId:\s*Optional\[str\]": "userId: Optional[int]",
        r"entityId:\s*Optional\[str\]": "entityId: Optional[int]",
        r"driver_id:\s*Optional\[str\]": "driver_id: Optional[int]",
    }
    
    for pat, repl in replacements.items():
        content = re.sub(pat, repl, content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Refactored more schemas successfully.")

if __name__ == "__main__":
    refactor_schemas2()
