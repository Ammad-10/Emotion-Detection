import sqlite3
import sys
import os

# Import password hashing from auth.py
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from auth import get_password_hash

def reset_data():
    db_path = "microfinance.db"
    if not os.path.exists(db_path):
        print(f"Error: Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Update all balances to 1000
    print("Updating all user balances to 1000...")
    cursor.execute("UPDATE users SET balance = 1000.0")
    
    # 2. Reset password for 'ahsan'
    new_password = "Password123"
    hashed_password = get_password_hash(new_password)
    print(f"Resetting password for user 'ahsan' to '{new_password}'...")
    cursor.execute("UPDATE users SET password_hash = ? WHERE username = 'ahsan'", (hashed_password,))
    
    # 3. Reset password for 'shabaz'
    print(f"Resetting password for user 'shabaz' to '{new_password}'...")
    cursor.execute("UPDATE users SET password_hash = ? WHERE username = 'shabaz'", (hashed_password,))
    
    if cursor.rowcount == 0:
        print("Warning: User 'ahsan' or 'shabaz' might not be found in database.")
    else:
        print("Successfully reset passwords.")

    conn.commit()
    conn.close()
    print("Database updates complete.")

if __name__ == "__main__":
    reset_data()
