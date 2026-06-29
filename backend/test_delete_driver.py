import requests

BASE_URL = "http://localhost:8000/api"

print("--- 1. Testing Delete Driver (Phase 6 Test) ---")
# Using the id from the previous test: usr_b8bb8ac2
driver_id = "usr_b8bb8ac2"
res = requests.delete(f"{BASE_URL}/drivers/{driver_id}")
print(res.status_code, res.text)

print("\n--- 2. Fetch Deleted Driver ---")
res2 = requests.get(f"{BASE_URL}/drivers/{driver_id}")
print(res2.status_code, res2.text)
