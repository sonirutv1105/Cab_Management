import requests

res = requests.post("http://localhost:8000/api/driver-drafts/", json={"first_name": "test"})
print("Status:", res.status_code)
print("Response:", res.text)
