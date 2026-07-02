import requests
import json

URL = "http://127.0.0.1:8000/api"

# Login
login_res = requests.post(f"{URL}/auth/login", json={"email": "admin@example.com", "password": "password123"})
if login_res.status_code != 200:
    print("Login failed:", login_res.text)
    exit(1)
token = login_res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Test Save Draft for Corporate Contract
draft_payload = {
    "id": "CORP-2026-999",
    "title": "Test Corporate Draft",
    "formData": json.dumps({"is_corporate": True, "contractName": "Test Corporate Draft", "companyName": "Test Corp"}),
    "sectionStatus": "{}",
    "activeSection": "A",
    "createdAt": "2026-07-01T12:00:00Z",
    "updatedAt": "2026-07-01T12:00:00Z",
    "completionPercentage": 10.0,
    "attachments": "[]"
}

res = requests.post(f"{URL}/contracts/drafts", json=draft_payload, headers=headers)
print("Create Draft Response:", res.status_code, res.text)

if res.status_code == 200:
    draft_id = res.json()["id"]
    # Test Get All Drafts
    res2 = requests.get(f"{URL}/contracts/drafts/all", headers=headers)
    print("All Drafts:", res2.status_code, res2.text)
