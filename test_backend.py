import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.abspath('backend'))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Login
login_res = client.post('/api/auth/login', json={'email': 'om@gmail.com', 'password': 'password123'})
token = login_res.json().get('access_token')

if not token:
    print("Login failed", login_res.json())
    sys.exit(1)

# Make the driver request
try:
    res = client.post(
        '/api/drivers/',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'name': 'Test Driver',
            'phone': '1234567890',
            'licenseNumber': 'DL123',
            'status': 'Active'
        }
    )
    print("STATUS", res.status_code)
    print("BODY", res.json())
except Exception as e:
    import traceback
    traceback.print_exc()
