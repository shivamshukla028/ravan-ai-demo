import urllib.request
import json

url = 'http://localhost:8001/api/auth/register'
data = json.dumps({
    "email": "test4@example.com",
    "password": "password123",
    "full_name": "Test User"
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
