import urllib.request
import json
import random

url = "http://localhost:8000/api/contracts/"
contract_num = f"TEST-{random.randint(1000, 9999)}"

payload = {
    "title": "Valid Title",
    "contractNumber": contract_num,
    "type": "Rental",
    "status": "Active",
    "startDate": "2026-06-20",
    "endDate": "2026-06-25", 
    "organisationName": "Test Org",
    "buyerEmail": "test@example.com",
    "buyerContact": "1234567890",
    "clientName": "Test Client",
    "contactPerson": "Test Person",
    "email": "test@example.com",
    "phone": "1234567890",
    "clientAddress": "Test Addr",
    "value": 100,
    "paymentTerms": "Net 30",
    "consigneeName": "Test Consignee",
    "consigneeAddress": "Test Cons Addr",
    "consigneeState": "Test State",
    "vehicleType": "Sedan",
    "department": "IT",
    "numberOfVehicles": 2,
    "id": f"cnt_{random.randint(100000, 999999)}"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    print("First request:")
    with urllib.request.urlopen(req) as response:
        print(response.status)
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode())

payload["id"] = f"cnt_{random.randint(100000, 999999)}"
data2 = json.dumps(payload).encode('utf-8')
req2 = urllib.request.Request(url, data=data2, headers={'Content-Type': 'application/json'}, method='POST')

try:
    print("Second request:")
    with urllib.request.urlopen(req2) as response:
        print(response.status)
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode())
