import requests
import json

base_url = "http://localhost:8000/api"

# Login
res = requests.post(f"{base_url}/auth/login", json={"email": "admin@example.com", "password": "password"})
if res.status_code != 200:
    print(f"Login failed: {res.text}")
    exit(1)

token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Get drivers
res = requests.get(f"{base_url}/drivers/", headers=headers)
print(f"GET /drivers/ : {res.status_code}")
if res.status_code == 200:
    print(f"Drivers count: {len(res.json())}")
else:
    print(res.text)

# Create driver
driver_payload = {
    "id": "drv_test_123",
    "name": "Test Driver",
    "firstName": "Test",
    "lastName": "Driver",
    "email": "test@driver.com",
    "phone": "9876543210",
    "licenseNumber": "DL-TEST-123",
    "licenseExpiry": "2030-12-31",
    "vendorId": "vnd_1",
    "status": "Active",
    "complianceStatus": "Verified",
    "address": "123 Test St",
    "rating": 5.0
}
res = requests.post(f"{base_url}/drivers/", headers=headers, json=driver_payload)
print(f"POST /drivers/ : {res.status_code}")
if res.status_code != 200:
    print(res.text)
else:
    print("Driver created successfully")

# Get drivers again
res = requests.get(f"{base_url}/drivers/", headers=headers)
print(f"GET /drivers/ after creation: {res.status_code}")
if res.status_code == 200:
    print(f"Drivers count: {len(res.json())}")

# Delete driver
res = requests.delete(f"{base_url}/drivers/drv_test_123", headers=headers)
print(f"DELETE /drivers/drv_test_123 : {res.status_code}")

