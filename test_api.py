import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("Testing Integration API...")
    
    # 1. Login to get token
    res = requests.post(f"{BASE_URL}/api/auth/login", data={"username": "superadmin@example.com", "password": "password"})
    if res.status_code != 200:
        print("Login failed:", res.text)
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Integration
    res = requests.post(f"{BASE_URL}/api/v1/integrations", json={"name": "Test Company API"}, headers=headers)
    if res.status_code != 200:
        print("Create integration failed:", res.text)
        return
    integration = res.json()
    print("Created Integration:", integration["name"])
    
    api_key = integration["api_key"]
    
    # 3. Test Booking Import
    import_headers = {"x-api-key": api_key, "Content-Type": "application/json"}
    payload = {
        "external_booking_id": f"EXT-{int(time.time())}",
        "passengerName": "Alice Johnson",
        "bookingDate": "2026-07-10",
        "rideTime": "14:30",
        "pickupPoint": "Airport Terminal 1",
        "dropPoint": "Downtown Hotel",
        "purpose": "Client Meeting",
        "source": "Corporate Portal"
    }
    
    print(f"\nSending payload: {json.dumps(payload, indent=2)}")
    res = requests.post(f"{BASE_URL}/api/v1/bookings/import", json=payload, headers=import_headers)
    print("Response:", res.status_code, res.text)
    
    # 4. Test Duplicate Prevention
    print("\nSending exact same payload (Testing Duplicate Detection)...")
    res = requests.post(f"{BASE_URL}/api/v1/bookings/import", json=payload, headers=import_headers)
    print("Response:", res.status_code, res.text)
    
    # 5. Fetch API Logs
    print("\nFetching API Logs...")
    res = requests.get(f"{BASE_URL}/api/v1/integrations/logs", headers=headers)
    if res.status_code == 200:
        logs = res.json()
        print(f"Found {len(logs)} logs.")
        for log in logs[:2]:
            print(f"- {log['method']} {log['endpoint']} -> {log['status_code']} ({log['response']})")
    else:
        print("Failed to fetch logs:", res.text)

if __name__ == "__main__":
    test_api()
