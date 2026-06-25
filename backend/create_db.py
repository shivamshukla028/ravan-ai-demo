import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        user="postgres",
        password="pgl@1234",
        dbname="postgres"
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname='ravan_ai'")
    exists = cur.fetchone()
    if not exists:
        cur.execute("CREATE DATABASE ravan_ai")
        print("SUCCESS: Database 'ravan_ai' created!")
    else:
        print("INFO: Database 'ravan_ai' already exists.")
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
