import requests
import json
import uuid
import os

BASE_URL = "http://localhost:8000/api"

print("Starting Phase 7 API Testing & Phase 3 Driver Creation Flow")

# 1. Test POST /driver-drafts/ (Step 1)
print("\n--- 1. Create Draft (Step 1) ---")
draft_payload = {
    "draft_id": f"drv_draft_{uuid.uuid4().hex[:8]}",
    "first_name": "Audit",
    "last_name": "Driver",
    "mobile_number": "9999999999",
    "vendor_id": "vendor_123",
    "assigned_vehicle_id": "veh_123",
    "issue_date": "2020-01-01",
    "expiry_date": "2030-01-01",
    "license_number": "LIC123456789",
    "current_step": 1
}
response = requests.post(f"{BASE_URL}/driver-drafts/", json=draft_payload)
print(response.status_code, response.text)
assert response.status_code == 200, "Failed to create draft"
draft_id = response.json()["draft_id"]

# 2. Test File Upload (Step 2)
print("\n--- 2. File Upload ---")
with open("test_audit.pdf", "w") as f:
    f.write("Audit test file")

with open("test_audit.pdf", "rb") as f:
    upload_res = requests.post(f"{BASE_URL}/upload/", files={"file": ("test_audit.pdf", f, "application/pdf")})
print(upload_res.status_code, upload_res.text)
assert upload_res.status_code == 200, "Failed to upload file"
file_url = upload_res.json()["url"]
os.remove("test_audit.pdf")

# 3. Update Draft with File (Step 2)
print("\n--- 3. Update Draft (Step 2) ---")
update_payload = {
    "current_step": 2,
    "dlFile": file_url,
    "aadhaarNumber": "123456789012"
}
response = requests.put(f"{BASE_URL}/driver-drafts/{draft_id}", json=update_payload)
print(response.status_code, response.text)
assert response.status_code == 200, "Failed to update draft"

# 4. Fetch Draft to Verify Data Persistence
print("\n--- 4. Fetch Draft ---")
response = requests.get(f"{BASE_URL}/driver-drafts/{draft_id}")
print(response.status_code, response.text)
assert response.status_code == 200, "Failed to get draft"
draft_data = response.json()
assert draft_data["dlFile"] == file_url, "Data loss: dlFile"
assert draft_data["aadhaarNumber"] == "123456789012", "Data loss: aadhaarNumber"

# 5. Convert Draft to Driver (Step 5)
print("\n--- 5. Convert Draft to Driver ---")
response = requests.post(f"{BASE_URL}/driver-drafts/{draft_id}/convert")
print(response.status_code, response.text)
if response.status_code != 200:
    print("ERROR BODY:", response.text)
assert response.status_code == 200, "Failed to convert draft"
driver_id = response.json()["id"]

# 6. Fetch Final Driver
print("\n--- 6. Fetch Final Driver ---")
response = requests.get(f"{BASE_URL}/drivers/{driver_id}")
print(response.status_code, response.text)
assert response.status_code == 200, "Failed to get driver"
driver_data = response.json()
print("Final Driver dlFile:", driver_data.get("dlFile"))
print("Final Driver aadhaarNumber:", driver_data.get("aadhaarNumber"))
assert driver_data["dlFile"] == file_url, "Data loss in conversion: dlFile"
assert driver_data["aadhaarNumber"] == "123456789012", "Data loss in conversion: aadhaarNumber"

print("\n✅ API Integration Test Passed! No Data Loss!")
