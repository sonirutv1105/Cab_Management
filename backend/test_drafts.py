import json
import urllib.request
import urllib.error

url = "http://localhost:8000/api/contracts/drafts"

payload = {
    "id": "test-draft-1",
    "title": "Test Draft",
    "formData": "{}",
    "sectionStatus": "{}",
    "activeSection": "A",
    "completionPercentage": 0,
    "attachments": "{}",
    "createdAt": "2026-06-23T06:00:00Z",
    "updatedAt": "2026-06-23T06:00:00Z"
}

print("=== Creating Draft ===")
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Content-Type', 'application/json')
try:
    resp = urllib.request.urlopen(req)
    body = resp.read().decode()
    print(f"Status: {resp.status}")
    print(f"Response: {body}")
except urllib.error.HTTPError as e:
    print(f"Error Status: {e.code}")
    print(f"Error Body: {e.read().decode()}")

print("\n=== Fetching All Drafts ===")
try:
    resp2 = urllib.request.urlopen(url + "/all")
    body2 = resp2.read().decode()
    drafts = json.loads(body2)
    print(f"Status: {resp2.status}")
    print(f"Draft Count: {len(drafts)}")
    for d in drafts:
        print(f"  - id={d['id']}, title={d['title']}")
except urllib.error.HTTPError as e:
    print(f"Error Status: {e.code}")
    print(f"Error Body: {e.read().decode()}")

print("\n=== Cleaning Up Test Draft ===")
try:
    req3 = urllib.request.Request(url + "/test-draft-1", method='DELETE')
    resp3 = urllib.request.urlopen(req3)
    print(f"Delete Status: {resp3.status}")
    print(f"Response: {resp3.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Error Status: {e.code}")
    print(f"Error Body: {e.read().decode()}")
