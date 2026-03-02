import urllib.request
import urllib.error
import json
import sqlite3

URL = "http://localhost:8001/api/auth/signup"
DATA = {
    "name": "Demo User",
    "father_name": "Demo Father",
    "date_of_birth": "1990-01-01",
    "email": "demo@example.com",
    "cnic": "1111111111111",
    "username": "demouser",
    "password": "demo1234",
    "face_image": "dnVsa2Fu" # Base64 for 'vulkan'
}

print("--- 1. CREATING DEMO USER ---")
try:
    req = urllib.request.Request(URL, data=json.dumps(DATA).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        print(f"User Created: {response.getcode()}")
        print(f"Response: {response.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Creation Failed (might already exist): {e.code}")
    print(f"Reason: {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")

print("\n--- 2. UPDATING BALANCE TO 50,000 ---")
try:
    conn = sqlite3.connect('microfinance.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET balance = 50000.0 WHERE username = 'demouser'")
    conn.commit()
    
    cursor.execute("SELECT * FROM users WHERE username = 'demouser'")
    user = cursor.fetchone()
    print(f"User Updated: {user}")
    conn.close()
except Exception as e:
    print(f"DB Error: {e}")
