import requests
import json
from sqlalchemy import create_engine, text

BASE_URL = "http://localhost:8000/api"

print("--- 1. Login ---")
login_payload = {"email": "rutvsoni06@gmail.com", "password": "password123"}
response = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
print(f"Login Response Status: {response.status_code}")

token = response.json().get("access_token")
if not token:
    print("FAILED TO GET TOKEN.")
    exit(1)

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("Login successful.")

print("\n--- 2. Save Draft Corporate Contract ---")
draft_payload = {
    "contractName": "RCA Test Corporate Contract",
    "contractNumber": "RCA-CORP-999",
    "contractStatus": "Draft",
    "company": "RCA Corp",
    "branch": "HQ",
    "clientContactPerson": "John Doe",
    "clientMobile": "9998887776",
    "clientEmail": "john@rcacorp.com",
    "gst": 18.0,
    "tds": 2.0,
    "client_details": {
        "companyCode": "RCA",
        "gstNumber": "22AAAAA0000A1Z5",
        "panNumber": "AAAAA0000A",
        "billingAddress": "123 RCA St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
    }
}
print(f"API Endpoint: POST /api/corporate-contracts/")
resp = requests.post(f"{BASE_URL}/corporate-contracts/", json=draft_payload, headers=headers)
print(f"Response Status: {resp.status_code}")
if resp.status_code != 201:
    print(resp.json())
    exit(1)
resp_data = resp.json()
saved_id = resp_data.get("id")

print("\n--- 3. Database Verification ---")
engine = create_engine("mysql+pymysql://root:@localhost:3306/cab_management")
with engine.connect() as conn:
    result = conn.execute(text(f"SELECT id, contractName, contractStatus FROM corporate_contracts WHERE id = {saved_id}"))
    row = result.fetchone()
    if row:
        print(f"INSERT SUCCESS. Primary Key: {row[0]}, Name: {row[1]}, Status: {row[2]}")
    else:
        print("INSERT FAILED. Record not found.")

print("\n--- 4. Fetch Draft Contracts ---")
print("API Endpoint: GET /api/contracts/drafts/all")
drafts_resp = requests.get(f"{BASE_URL}/contracts/drafts/all", headers=headers)
print(f"Response Status: {drafts_resp.status_code}")
if drafts_resp.status_code != 200:
    print(f"Failed to fetch drafts: {drafts_resp.json()}")
    exit(1)

drafts_data = drafts_resp.json()
found = False
for d in drafts_data:
    if d.get("id") == saved_id and json.loads(d.get("formData", "{}")).get("is_corporate") == True:
        found = True
        print(f"Draft Found in API response: {json.dumps(d, indent=2)}")
        break

if not found:
    print("Draft NOT FOUND in API response.")

