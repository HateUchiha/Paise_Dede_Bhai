import os
import sqlite3
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "paisa_dede_bhai.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_column(cursor, table: str, column: str, ddl: str):
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cursor.fetchall()]
    if column not in cols:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        display_name TEXT,
        avatar_url TEXT,
        whatsapp_logged_in BOOLEAN DEFAULT 0,
        chrome_profile_path TEXT,
        total_lent REAL DEFAULT 0,
        total_recovered REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        whatsapp_name TEXT NOT NULL,
        display_name TEXT,
        phone TEXT,
        upi_id TEXT,
        language TEXT DEFAULT 'english',
        tone TEXT DEFAULT 'casual',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        contact_id TEXT NOT NULL,
        total_amount REAL DEFAULT 0,
        amount_recovered REAL DEFAULT 0,
        status TEXT DEFAULT 'open',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(contact_id) REFERENCES contacts(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS debt_entries (
        id TEXT PRIMARY KEY,
        debt_id TEXT NOT NULL,
        user_id TEXT,
        entry_type TEXT NOT NULL,
        amount REAL NOT NULL,
        comment TEXT NOT NULL,
        entry_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        FOREIGN KEY(debt_id) REFERENCES debts(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reminder_sessions (
        id TEXT PRIMARY KEY,
        debt_id TEXT NOT NULL,
        user_id TEXT,
        contact_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        interval_minutes INTEGER DEFAULT 60,
        language TEXT DEFAULT 'english',
        tone TEXT DEFAULT 'casual',
        approved_messages TEXT,
        current_msg_index INTEGER DEFAULT 0,
        reminders_sent INTEGER DEFAULT 0,
        qr_filename TEXT,
        next_reminder_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(debt_id) REFERENCES debts(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(contact_id) REFERENCES contacts(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        message_type TEXT DEFAULT 'reminder',
        analyzed_intent TEXT,
        intent_date TEXT,
        raw_response TEXT,
        timestamp TEXT,
        FOREIGN KEY(session_id) REFERENCES reminder_sessions(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_message_batches (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        user_id TEXT,
        messages TEXT,
        tone TEXT,
        language TEXT,
        user_approved INTEGER DEFAULT 0,
        approved_at TIMESTAMP,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    _ensure_column(cursor, "users", "chrome_profile_path", "TEXT")
    _ensure_column(cursor, "users", "meta_messages_quota", "INTEGER DEFAULT 1000")
    _ensure_column(cursor, "users", "meta_messages_used", "INTEGER DEFAULT 0")
    _ensure_column(cursor, "users", "connection_type", "TEXT NOT NULL DEFAULT 'personal'")
    _ensure_column(cursor, "users", "whatsapp_id", "TEXT UNIQUE")
    # Create per‑business quota table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS whatsapp_quota (
        wa_id TEXT PRIMARY KEY,
        quota INTEGER DEFAULT 1000,
        used INTEGER DEFAULT 0
    )
    """)
    # Optional personal quota tracking (currently unused)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS personal_quota (
        user_id TEXT PRIMARY KEY,
        quota INTEGER DEFAULT 999999,
        used INTEGER DEFAULT 0
    )
    """)
    _ensure_column(cursor, "debt_entries", "created_by", "TEXT")
    _ensure_column(cursor, "chat_messages", "raw_response", "TEXT")
    _ensure_column(cursor, "chat_messages", "raw_response", "TEXT")


    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        default_user_id = "user_zqg365_admin"
        profile = os.path.join(r"C:\selenium\profiles", default_user_id)
        cursor.execute("""
        INSERT INTO users (id, email, display_name, avatar_url, whatsapp_logged_in, chrome_profile_path, total_lent, total_recovered)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            default_user_id,
            "admin@zqg365.com",
            "ZQG365 User",
            "https://api.dicebear.com/7.x/bottts/svg?seed=ZQG365",
            0,
            profile,
            14200.0,
            4500.0,
        ))

        contacts = [
            ("cnt_rahul", default_user_id, "Rahul Sharma", "Rahul (College)", "rahul@upi", "hindi", "angry"),
            ("cnt_sourav", default_user_id, "Sourav Mukherjee", "Sourav (Office)", "sourav@okhdfcbank", "bengali", "casual"),
            ("cnt_ananya", default_user_id, "Ananya Verma", "Ananya (Roommate)", "ananya@oksbi", "english", "serious"),
        ]
        for c in contacts:
            cursor.execute("""
            INSERT INTO contacts (id, user_id, whatsapp_name, display_name, upi_id, language, tone)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, c)

        debts = [
            ("debt_rahul_1", default_user_id, "cnt_rahul", 5200.0, 1500.0, "open", "Goa trip hotel split"),
            ("debt_sourav_1", default_user_id, "cnt_sourav", 3000.0, 3000.0, "closed", "Dinner party bill"),
            ("debt_ananya_1", default_user_id, "cnt_ananya", 6000.0, 0.0, "open", "Apartment wifi & grocery share"),
        ]
        for d in debts:
            cursor.execute("""
            INSERT INTO debts (id, user_id, contact_id, total_amount, amount_recovered, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, d)

        entries = [
            ("ent_1", "debt_rahul_1", default_user_id, "lent", 5200.0, "Initial Goa trip hotel booking paid via card", "2026-08-15"),
            ("ent_2", "debt_rahul_1", default_user_id, "payment", 1500.0, "GPay partial payment after 1st reminder", "2026-08-20"),
            ("ent_3", "debt_sourav_1", default_user_id, "lent", 3000.0, "Park street restaurant bill split", "2026-08-28"),
            ("ent_4", "debt_sourav_1", default_user_id, "payment", 3000.0, "Full payment received via PhonePe", "2026-09-01"),
            ("ent_5", "debt_ananya_1", default_user_id, "lent", 6000.0, "Electricity and grocery bill August", "2026-09-02"),
        ]
        for e in entries:
            cursor.execute("""
            INSERT INTO debt_entries (id, debt_id, user_id, entry_type, amount, comment, entry_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (*e, default_user_id))

        conn.commit()

    conn.close()


def upsert_user(user_id: str, email: str, display_name: str, avatar_url: Optional[str] = None) -> dict:
    profile = os.path.join(r"C:\selenium\profiles", user_id)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
            UPDATE users SET email = ?, display_name = ?, avatar_url = COALESCE(?, avatar_url),
                chrome_profile_path = COALESCE(chrome_profile_path, ?)
            WHERE id = ?
        """, (email, display_name, avatar_url, profile, user_id))
    else:
        cursor.execute("""
            INSERT INTO users (id, email, display_name, avatar_url, whatsapp_logged_in, chrome_profile_path)
            VALUES (?, ?, ?, ?, 0, ?)
        """, (user_id, email, display_name, avatar_url, profile))
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row


def get_user_quota(user_id: str) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    # Determine connection type
    cursor.execute("SELECT connection_type, whatsapp_id FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    conn.close()
    if not user_row:
        # default to personal unlimited
        return {"quota": 999999, "used": 0, "remaining": 999999}
    connection_type = user_row["connection_type"] or "personal"
    if connection_type == "business":
        wa_id = user_row["whatsapp_id"]
        if not wa_id:
            return {"quota": 0, "used": 0, "remaining": 0}
        # Use whatsapp_quota table
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT quota, used FROM whatsapp_quota WHERE wa_id = ?", (wa_id,))
        row = cur.fetchone()
        if not row:
            # create default quota row
            cur.execute("INSERT INTO whatsapp_quota (wa_id, quota, used) VALUES (?, 1000, 0)", (wa_id,))
            conn.commit()
            quota, used = 1000, 0
        else:
            quota = row["quota"]
            used = row["used"]
        conn.close()
        return {"quota": quota, "used": used, "remaining": max(0, quota - used)}
    else:
        # personal flow: unlimited (or large quota)
        return {"quota": 999999, "used": 0, "remaining": 999999}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT meta_messages_quota, meta_messages_used FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"quota": 1000, "used": 0, "remaining": 1000}
    quota = row["meta_messages_quota"] if row["meta_messages_quota"] is not None else 1000
    used = row["meta_messages_used"] or 0
    return {"quota": quota, "used": used, "remaining": max(0, quota - used)}


def deduct_user_quota(user_id: str, count: int = 1) -> dict:
    # Determine connection type for the user
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT connection_type, whatsapp_id FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return get_user_quota(user_id)
    connection_type = row["connection_type"] or "personal"
    if connection_type == "business":
        wa_id = row["whatsapp_id"]
        if not wa_id:
            return get_user_quota(user_id)
        # Update business quota table
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE whatsapp_quota SET used = COALESCE(used, 0) + ? WHERE wa_id = ?
            """,
            (count, wa_id)
        )
        conn.commit()
        conn.close()
        return get_user_quota(user_id)
    else:
        # Personal flow: update meta_messages_used for compatibility (quota is effectively unlimited)
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users 
            SET meta_messages_used = COALESCE(meta_messages_used, 0) + ? 
            WHERE id = ?
            """,
            (count, user_id)
        )
        conn.commit()
        conn.close()
        return get_user_quota(user_id)


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")

