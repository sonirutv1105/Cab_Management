import requests
import uuid

BASE_URL = "http://localhost:8000/api"

print("--- 1. Create Driver ---")
payload = {
    "name": "Update Test Driver",
    "phone": "8888888888",
    "licenseNumber": "LIC88888",
    "licenseExpiry": "2030-01-01",
    "vendorId": "vendor_123",
    "status": "Active",
    "complianceStatus": "Pending",
    "id": f"usr_{uuid.uuid4().hex[:8]}"
}
res = requests.post(f"{BASE_URL}/drivers/", json=payload)
print(res.status_code, res.text)
driver_id = res.json()["id"]

print("\n--- 2. Update Driver (Phase 5 Test) ---")
update_payload = {
    "name": "Updated Driver Name",
    "phone": "8888888888",
    "licenseNumber": "LIC88888",
    "licenseExpiry": "2030-01-01",
    "vendorId": "vendor_123",
    "status": "Active",
    "complianceStatus": "Pending",
    "firstName": "Updated",
    "lastName": "Driver",
    "city": "Mumbai",
    "state": "MH",
    "pinCode": "400001",
    "yearsOfExperience": 5,
    "aadhaarNumber": "888888888888",
    "is_draft": False,
    "current_step": 5
}
res2 = requests.put(f"{BASE_URL}/drivers/{driver_id}", json=update_payload)
print(res2.status_code, res2.text)

print("\n--- 3. Fetch Updated Driver ---")
res3 = requests.get(f"{BASE_URL}/drivers/{driver_id}")
print(res3.status_code, res3.json().get("firstName"), res3.json().get("aadhaarNumber"), res3.json().get("city"))
