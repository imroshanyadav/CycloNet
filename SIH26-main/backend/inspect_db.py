import sqlite3

con = sqlite3.connect('cyclonewatch.db')
cur = con.cursor()
tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", [t[0] for t in tables])
try:
    events = cur.execute("SELECT event_id, name, year FROM events").fetchall()
    print("Events in DB:", events)
    replays = cur.execute("SELECT COUNT(*) FROM predictions").fetchone()
    print("Predictions count:", replays[0])
    metrics = cur.execute("SELECT COUNT(*) FROM metrics").fetchone()
    print("Metrics count:", metrics[0])
except Exception as e:
    print("Error:", e)
con.close()
