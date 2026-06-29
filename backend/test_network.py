import requests
import json

url = "http://localhost:8000/api/driver-drafts/"
payload = {
    "draft_id": "test_draft_run_1",
    "first_name": "Test",
    "last_name": "Driver"
}

try:
    res = requests.post(url, json=payload, timeout=5)
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text)
except Exception as e:
    print("EXCEPTION:", str(e))
