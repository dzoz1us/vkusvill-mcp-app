import sqlite3

conn = sqlite3.connect("app-java.db")
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", cur.fetchall())

cur.execute("PRAGMA table_info(ingredients)")
print("Columns in ingredients:")
for col in cur.fetchall():
    print("  ", col)

conn.close()