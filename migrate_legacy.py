import os
import sqlite3
from db import get_db, init_db

def migrate():
    # Ensure DB initialized
    init_db()
    conn = get_db()
    # Add columns if not exist (idempotent via db helper)
    try:
        conn.execute("ALTER TABLE users ADD COLUMN connection_type TEXT NOT NULL DEFAULT 'personal'")
    except Exception:
        pass
    try:
        conn.execute("ALTER TABLE users ADD COLUMN whatsapp_id TEXT UNIQUE")
    except Exception:
        pass
    # Create quota tables if not exist
    conn.execute("""
        CREATE TABLE IF NOT EXISTS whatsapp_quota (
            wa_id TEXT PRIMARY KEY,
            quota INTEGER DEFAULT 1000,
            used INTEGER DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS personal_quota (
            user_id TEXT PRIMARY KEY,
            quota INTEGER DEFAULT 999999,
            used INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
