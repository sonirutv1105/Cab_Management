import requests
import json
from sqlalchemy import create_engine, text

BASE_URL = "http://localhost:8000/api"

print("--- 1. Login ---")
login_payload = {"email": "admin@example.com", "password": "password123"}
response = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
print(f"Login Response Status: {response.status_code}")

token = response.json().get("access_token")
if not token:
    print("FAILED TO GET TOKEN.")
    exit(1)

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("Login successful.")

print("\n--- 2. Fetch Draft Contracts ---")
print("API Endpoint: GET /api/contracts/drafts/all")
drafts_resp = requests.get(f"{BASE_URL}/contracts/drafts/all", headers=headers)
print(f"Response Status: {drafts_resp.status_code}")
if drafts_resp.status_code != 200:
    print(f"Failed to fetch drafts: {drafts_resp.json()}")
    exit(1)

drafts_data = drafts_resp.json()
found = False
for d in drafts_data:
    if json.loads(d.get("formData", "{}")).get("is_corporate") == True:
        found = True
        print(f"Corporate Draft Found in API response: {json.dumps(d, indent=2)}")
        break

if not found:
    print("Corporate Draft NOT FOUND in API response.")
else:
    print("Success: Admin can now view Corporate Drafts!")
