import json
import os
import uuid
from datetime import datetime, date
from typing import List, Optional
import hmac, hashlib

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from auth import create_access_token, get_current_user
from db import get_db, init_db, upsert_user, get_user_quota, deduct_user_quota
from ai_service import generate_ai_messages

from whatsapp_manager import whatsapp_mgr, QR_DIR
from session_manager import session_mgr

init_db()

app = FastAPI(
    title="Paisa Dede Bhai v2 API Bridge",
    description="Developed by ZQG365 Application Services",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MIN_INTERVAL_MINUTES = 15


class ContactCreate(BaseModel):
    whatsapp_name: str
    display_name: Optional[str] = None
    phone: Optional[str] = None
    upi_id: Optional[str] = None
    language: str = "english"
    tone: str = "casual"


class DebtCreate(BaseModel):
    contact_id: str
    total_amount: float
    notes: Optional[str] = None
    initial_comment: Optional[str] = "Initial debt registered"
    entry_date: Optional[str] = None


class DebtUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class DebtEntryCreate(BaseModel):
    entry_type: str
    amount: float
    comment: str
    entry_date: Optional[str] = None


class DebtEntryUpdate(BaseModel):
    amount: float
    comment: str
    entry_date: str


class GenerateMessagesRequest(BaseModel):
    contact_name: str
    amount: float
    tone: str = "casual"
    language: str = "english"
    session_id: Optional[str] = None


class StartSessionRequest(BaseModel):
    debt_id: str
    contact_id: str
    interval_minutes: int = 60
    language: str = "english"
    tone: str = "casual"
    approved_messages: List[str] = Field(default_factory=list)


class ApproveMessagesRequest(BaseModel):
    messages: List[str]
    tone: Optional[str] = None
    language: Optional[str] = None


class SimulateReplyRequest(BaseModel):
    reply_text: Optional[str] = None
    text: Optional[str] = None


class ConfirmCloseRequest(BaseModel):
    record_payment: bool = True
    payment_amount: Optional[float] = None
    payment_comment: str = "Payment confirmed and debt settled"


class AuthSyncRequest(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


def uid(user: dict) -> str:
    return user["id"]


def seconds_until(iso_value) -> int:
    if not iso_value:
        return 0
    try:
        dt = datetime.fromisoformat(str(iso_value))
        return max(0, int((dt - datetime.now()).total_seconds()))
    except Exception:
        return 0


# ----------------- AUTH -----------------
@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


@app.post("/api/auth/sync")
async def sync_user(req: AuthSyncRequest, user: dict = Depends(get_current_user)):
    return upsert_user(
        req.id or user["id"],
        req.email or user.get("email"),
        req.display_name or user.get("display_name"),
        req.avatar_url or user.get("avatar_url"),
    )


@app.post("/api/auth/login-google")
async def login_google():
    user = upsert_user(
        "user_zqg365_admin",
        "admin@zqg365.com",
        "ZQG365 User",
        "https://api.dicebear.com/7.x/bottts/svg?seed=ZQG365",
    )
    token = create_access_token(user["id"], user["email"], user["display_name"])
    return {**user, "access_token": token, "token_type": "bearer"}


@app.post("/api/auth/logout")
async def logout():
    return {"status": "logged_out"}


# ----------------- WHATSAPP -----------------
@app.get("/api/whatsapp/status")
async def get_whatsapp_status(user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT whatsapp_logged_in, chrome_profile_path FROM users WHERE id = ?", (uid(user),)).fetchone()
    conn.close()
    logged_in = bool(row["whatsapp_logged_in"]) if row else False
    return {
        "connected": logged_in,
        "logged_in": logged_in,
        "chrome_profile_path": row["chrome_profile_path"] if row else None,
        "service": "WhatsApp Web Multi-Device",
        "dry_run": whatsapp_mgr.dry_run,
    }


@app.get("/api/whatsapp/qr")
async def get_whatsapp_qr(user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT connection_type FROM users WHERE id = ?", (uid(user),)).fetchone()
    conn.close()
    if row and row["connection_type"] != "personal":
        raise HTTPException(status_code=403, detail="QR endpoint is only available for personal WhatsApp connections.")
    filename = whatsapp_mgr.get_whatsapp_login_qr()
    return {"qr_filename": filename, "qr_url": f"/api/qr/{filename}", "logged_in": False}


@app.get("/api/whatsapp/qr-status")
async def get_whatsapp_qr_status(user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT whatsapp_logged_in FROM users WHERE id = ?", (uid(user),)).fetchone()
    conn.close()
    return {"logged_in": bool(row["whatsapp_logged_in"]) if row else False}


@app.post("/api/whatsapp/connect")
async def connect_whatsapp(user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT connection_type FROM users WHERE id = ?", (uid(user),)).fetchone()
    conn.close()
    if row and row["connection_type"] != "personal":
        raise HTTPException(status_code=403, detail="Connect endpoint is only for personal WhatsApp connections.")
    conn = get_db()
    conn.execute("UPDATE users SET whatsapp_logged_in = 1 WHERE id = ?", (uid(user),))
    conn.commit()
    conn.close()
    whatsapp_mgr.set_connected(True)
    await session_mgr.broadcast({"type": "whatsapp_status_changed", "connected": True, "user_id": uid(user)})
    return {"status": "connected", "logged_in": True}


@app.post("/api/whatsapp/logout")
@app.post("/api/whatsapp/disconnect")
async def disconnect_whatsapp(user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT connection_type FROM users WHERE id = ?", (uid(user),)).fetchone()
    conn.close()
    if row and row["connection_type"] != "personal":
        raise HTTPException(status_code=403, detail="Disconnect endpoint is only for personal WhatsApp connections.")
    conn = get_db()
    conn.execute("UPDATE users SET whatsapp_logged_in = 0 WHERE id = ?", (uid(user),))
    conn.commit()
    conn.close()
    whatsapp_mgr.set_connected(False)
    await session_mgr.broadcast({"type": "whatsapp_status_changed", "connected": False, "user_id": uid(user)})
    return {"status": "disconnected", "logged_in": False}


# ---------- NEW WHATSAPP ENDPOINTS ----------

from pydantic import BaseModel
from typing import Optional
import hmac, hashlib, json

class WhatsAppLinkRequest(BaseModel):
    type: str  # "personal" or "business"
    wa_id: Optional[str] = None

@app.post("/api/whatsapp/link")
async def link_whatsapp(req: WhatsAppLinkRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    if req.type == "business":
        if not req.wa_id:
            raise HTTPException(status_code=400, detail="wa_id required for business connection")
        conn.execute(
            "UPDATE users SET connection_type = ?, whatsapp_id = ? WHERE id = ?",
            ("business", req.wa_id, uid(user)),
        )
        conn.execute(
            "INSERT OR IGNORE INTO whatsapp_quota (wa_id) VALUES (?)",
            (req.wa_id,),
        )
    else:
        conn.execute(
            "UPDATE users SET connection_type = ?, whatsapp_id = NULL WHERE id = ?",
            ("personal", uid(user)),
        )
    conn.commit()
    conn.close()
    return {"status": "linked", "connection_type": req.type, "wa_id": req.wa_id}

@app.post("/api/whatsapp/webhook")
async def whatsapp_webhook(request: Request, user: dict = Depends(get_current_user)):
    secret = os.getenv("META_WHATSAPP_APP_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="Missing webhook secret")
    body_bytes = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    expected = "sha256=" + hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")
    payload = json.loads(body_bytes)
    wa_id = payload.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("metadata", {}).get("phone_number_id")
    if not wa_id:
        raise HTTPException(status_code=400, detail="phone_number_id not found")
    conn = get_db()
    conn.execute(
        "UPDATE users SET connection_type = ?, whatsapp_id = ? WHERE id = ?",
        ("business", wa_id, uid(user)),
    )
    conn.execute(
        "INSERT OR IGNORE INTO whatsapp_quota (wa_id) VALUES (?)",
        (wa_id,),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}

# ----------------- CONTACTS -----------------
@app.get("/api/contacts")
async def list_contacts(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC",
        (uid(user),),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/contacts")
async def create_contact(req: ContactCreate, user: dict = Depends(get_current_user)):
    contact_id = f"cnt_{uuid.uuid4().hex[:8]}"
    conn = get_db()
    conn.execute("""
        INSERT INTO contacts (id, user_id, whatsapp_name, display_name, phone, upi_id, language, tone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (contact_id, uid(user), req.whatsapp_name.strip(), req.display_name, req.phone, req.upi_id, req.language, req.tone))
    conn.commit()
    row = conn.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,)).fetchone()
    conn.close()
    return dict(row)


@app.put("/api/contacts/{id}")
async def update_contact(id: str, req: ContactCreate, user: dict = Depends(get_current_user)):
    conn = get_db()
    conn.execute("""
        UPDATE contacts
        SET whatsapp_name = ?, display_name = ?, phone = ?, upi_id = ?, language = ?, tone = ?
        WHERE id = ? AND user_id = ?
    """, (req.whatsapp_name.strip(), req.display_name, req.phone, req.upi_id, req.language, req.tone, id, uid(user)))
    conn.commit()
    row = conn.execute("SELECT * FROM contacts WHERE id = ?", (id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Contact not found")
    return dict(row)


@app.delete("/api/contacts/{id}")
async def delete_contact(id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    conn.execute("DELETE FROM contacts WHERE id = ? AND user_id = ?", (id, uid(user)))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# ----------------- DEBTS -----------------
def recalc_debt_totals(debt_id: str, user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            SUM(CASE WHEN entry_type = 'lent' THEN amount ELSE 0 END) as total_lent,
            SUM(CASE WHEN entry_type = 'payment' THEN amount ELSE 0 END) as total_paid,
            SUM(CASE WHEN entry_type = 'adjustment' THEN amount ELSE 0 END) as total_adj
        FROM debt_entries
        WHERE debt_id = ?
    """, (debt_id,))
    res = cursor.fetchone()
    total_amount = (res["total_lent"] or 0) + (res["total_adj"] or 0)
    amount_recovered = res["total_paid"] or 0
    status = "closed" if total_amount > 0 and amount_recovered >= total_amount else ("partially_paid" if amount_recovered > 0 else "open")
    cursor.execute("""
        UPDATE debts SET total_amount = ?, amount_recovered = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (total_amount, amount_recovered, status, debt_id))
    cursor.execute("""
        SELECT SUM(total_amount) as user_lent, SUM(amount_recovered) as user_recovered
        FROM debts WHERE user_id = ?
    """, (user_id,))
    user_totals = cursor.fetchone()
    cursor.execute("""
        UPDATE users SET total_lent = ?, total_recovered = ? WHERE id = ?
    """, (user_totals["user_lent"] or 0, user_totals["user_recovered"] or 0, user_id))
    conn.commit()
    conn.close()


@app.get("/api/debts")
async def list_debts(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("""
        SELECT d.*, c.whatsapp_name, c.display_name, c.upi_id, c.language, c.tone,
               (d.total_amount - d.amount_recovered) as balance,
               (SELECT id FROM reminder_sessions s WHERE s.debt_id = d.id AND s.status IN ('active', 'paused', 'payment_detected', 'promise_detected') LIMIT 1) as active_session_id
        FROM debts d
        JOIN contacts c ON d.contact_id = c.id
        WHERE d.user_id = ?
        ORDER BY d.created_at DESC
    """, (uid(user),)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/debts")
async def create_debt(req: DebtCreate, user: dict = Depends(get_current_user)):
    debt_id = f"debt_{uuid.uuid4().hex[:8]}"
    entry_id = f"ent_{uuid.uuid4().hex[:8]}"
    today_str = req.entry_date or date.today().isoformat()
    conn = get_db()
    conn.execute("""
        INSERT INTO debts (id, user_id, contact_id, total_amount, amount_recovered, status, notes)
        VALUES (?, ?, ?, ?, ?, 'open', ?)
    """, (debt_id, uid(user), req.contact_id, req.total_amount, 0.0, req.notes))
    conn.execute("""
        INSERT INTO debt_entries (id, debt_id, user_id, entry_type, amount, comment, entry_date, created_by)
        VALUES (?, ?, ?, 'lent', ?, ?, ?, ?)
    """, (entry_id, debt_id, uid(user), req.total_amount, req.initial_comment or "Initial debt lent", today_str, uid(user)))
    conn.commit()
    conn.close()
    recalc_debt_totals(debt_id, uid(user))
    conn = get_db()
    row = conn.execute("SELECT * FROM debts WHERE id = ?", (debt_id,)).fetchone()
    conn.close()
    return dict(row)


@app.put("/api/debts/{id}")
async def update_debt(id: str, req: DebtUpdate, user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT * FROM debts WHERE id = ? AND user_id = ?", (id, uid(user))).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Debt not found")
    status = req.status if req.status is not None else row["status"]
    notes = req.notes if req.notes is not None else row["notes"]
    conn.execute("UPDATE debts SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (status, notes, id))
    conn.commit()
    updated = conn.execute("SELECT * FROM debts WHERE id = ?", (id,)).fetchone()
    conn.close()
    return dict(updated)


@app.get("/api/debts/{id}/entries")
async def list_debt_entries(id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM debt_entries WHERE debt_id = ? AND user_id = ? ORDER BY entry_date DESC, created_at DESC",
        (id, uid(user)),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/debts/{id}/history")
async def debt_history(id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    sessions = conn.execute("""
        SELECT s.*, c.whatsapp_name
        FROM reminder_sessions s
        JOIN contacts c ON s.contact_id = c.id
        WHERE s.debt_id = ? AND s.user_id = ?
        ORDER BY s.created_at DESC
    """, (id, uid(user))).fetchall()
    conn.close()
    result = []
    for s in sessions:
        d = dict(s)
        d["approved_messages"] = json.loads(d["approved_messages"]) if d["approved_messages"] else []
        result.append(d)
    return result


@app.post("/api/debts/{id}/entries")
async def add_debt_entry(id: str, req: DebtEntryCreate, user: dict = Depends(get_current_user)):
    if not req.comment.strip():
        raise HTTPException(status_code=400, detail="Comment is required")
    entry_id = f"ent_{uuid.uuid4().hex[:8]}"
    entry_date = req.entry_date or date.today().isoformat()
    conn = get_db()
    conn.execute("""
        INSERT INTO debt_entries (id, debt_id, user_id, entry_type, amount, comment, entry_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (entry_id, id, uid(user), req.entry_type, req.amount, req.comment, entry_date, uid(user)))
    conn.commit()
    conn.close()
    recalc_debt_totals(id, uid(user))
    return {"status": "added", "entry_id": entry_id}


@app.put("/api/entries/{id}")
async def update_entry(id: str, req: DebtEntryUpdate, user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT debt_id FROM debt_entries WHERE id = ? AND user_id = ?", (id, uid(user))).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Entry not found")
    debt_id = row["debt_id"]
    conn.execute("UPDATE debt_entries SET amount = ?, comment = ?, entry_date = ? WHERE id = ?", (req.amount, req.comment, req.entry_date, id))
    conn.commit()
    conn.close()
    recalc_debt_totals(debt_id, uid(user))
    return {"status": "updated"}


@app.delete("/api/entries/{id}")
async def delete_entry(id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT debt_id FROM debt_entries WHERE id = ? AND user_id = ?", (id, uid(user))).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Entry not found")
    debt_id = row["debt_id"]
    conn.execute("DELETE FROM debt_entries WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    recalc_debt_totals(debt_id, uid(user))
    return {"status": "deleted"}


@app.get("/api/metrics")
async def get_metrics(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT total_lent, total_recovered FROM users WHERE id = ?", (uid(user),))
    row = cursor.fetchone()
    cursor.execute("SELECT COUNT(*) FROM reminder_sessions WHERE user_id = ? AND status = 'active'", (uid(user),))
    active_sessions = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM debts WHERE user_id = ? AND status != 'closed'", (uid(user),))
    open_debts = cursor.fetchone()[0]
    conn.close()
    total_lent = row["total_lent"] if row else 0.0
    total_recovered = row["total_recovered"] if row else 0.0
    quota_info = get_user_quota(uid(user))
    return {
        "total_debt_lent": total_lent,
        "total_debt_recovered": total_recovered,
        "outstanding_balance": max(0.0, total_lent - total_recovered),
        "active_sessions_count": active_sessions,
        "open_debts_count": open_debts,
        "meta_messages_quota": quota_info["quota"],
        "meta_messages_used": quota_info["used"],
        "meta_messages_remaining": quota_info["remaining"],
        "developer": "ZQG365 Application Services",
    }


@app.get("/api/user/quota")
async def get_my_quota(user: dict = Depends(get_current_user)):
    return get_user_quota(uid(user))



@app.get("/api/activity")
async def recent_activity(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("""
        SELECT m.*, s.contact_id, c.whatsapp_name
        FROM chat_messages m
        JOIN reminder_sessions s ON s.id = m.session_id
        JOIN contacts c ON c.id = s.contact_id
        WHERE s.user_id = ?
        ORDER BY m.rowid DESC
        LIMIT 40
    """, (uid(user),)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ----------------- AI -----------------
@app.post("/api/ai/generate-messages")
async def generate_messages(req: GenerateMessagesRequest, user: dict = Depends(get_current_user)):
    messages = generate_ai_messages(name=req.contact_name, amount=req.amount, tone=req.tone, language=req.language)
    batch_id = f"batch_{uuid.uuid4().hex[:8]}"
    conn = get_db()
    conn.execute("""
        INSERT INTO ai_message_batches (id, session_id, user_id, messages, tone, language, user_approved)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    """, (batch_id, req.session_id, uid(user), json.dumps(messages), req.tone, req.language))
    conn.commit()
    conn.close()
    return {
        "batch_id": batch_id,
        "contact_name": req.contact_name,
        "amount": req.amount,
        "tone": req.tone,
        "language": req.language,
        "messages": messages,
    }


# ----------------- SESSIONS -----------------
async def _start_session(req: StartSessionRequest, user: dict):
    if len(req.approved_messages) < 3:
        raise HTTPException(status_code=400, detail="Approve at least 3 messages before starting.")
    if req.interval_minutes < MIN_INTERVAL_MINUTES:
        raise HTTPException(status_code=400, detail=f"Minimum interval is {MIN_INTERVAL_MINUTES} minutes.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.whatsapp_name, c.upi_id, (d.total_amount - d.amount_recovered) as balance
        FROM contacts c JOIN debts d ON d.contact_id = c.id
        WHERE c.id = ? AND d.id = ? AND d.user_id = ?
    """, (req.contact_id, req.debt_id, uid(user)))
    info = cursor.fetchone()
    if not info:
        conn.close()
        raise HTTPException(status_code=404, detail="Contact or Debt record not found")

    qr_filename = None
    if info["upi_id"]:
        qr_filename = whatsapp_mgr.generate_upi_qr(info["upi_id"], info["whatsapp_name"], info["balance"])

    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO reminder_sessions (
            id, debt_id, user_id, contact_id, status, interval_minutes, language, tone,
            approved_messages, current_msg_index, reminders_sent, qr_filename, next_reminder_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, 0, 0, ?, CURRENT_TIMESTAMP)
    """, (
        session_id, req.debt_id, uid(user), req.contact_id, req.interval_minutes,
        req.language, req.tone, json.dumps(req.approved_messages), qr_filename,
    ))
    cursor.execute("""
        INSERT INTO ai_message_batches (id, session_id, user_id, messages, tone, language, user_approved, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    """, (f"batch_{uuid.uuid4().hex[:8]}", session_id, uid(user), json.dumps(req.approved_messages), req.tone, req.language))
    conn.commit()
    conn.close()
    await session_mgr.start_session(session_id)
    return {
        "status": "started",
        "session_id": session_id,
        "qr_filename": qr_filename,
        "approved_count": len(req.approved_messages),
    }


@app.post("/api/sessions")
@app.post("/api/sessions/start-with-approval")
async def start_session_with_approval(req: StartSessionRequest, user: dict = Depends(get_current_user)):
    return await _start_session(req, user)


@app.post("/api/sessions/{id}/approve-messages")
async def approve_messages(id: str, req: ApproveMessagesRequest, user: dict = Depends(get_current_user)):
    if len(req.messages) < 3:
        raise HTTPException(status_code=400, detail="Approve at least 3 messages.")
    conn = get_db()
    row = conn.execute("SELECT * FROM reminder_sessions WHERE id = ? AND user_id = ?", (id, uid(user))).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    conn.execute(
        "UPDATE reminder_sessions SET approved_messages = ?, tone = COALESCE(?, tone), language = COALESCE(?, language) WHERE id = ?",
        (json.dumps(req.messages), req.tone, req.language, id),
    )
    conn.execute("""
        INSERT INTO ai_message_batches (id, session_id, user_id, messages, tone, language, user_approved, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    """, (f"batch_{uuid.uuid4().hex[:8]}", id, uid(user), json.dumps(req.messages), req.tone or row["tone"], req.language or row["language"]))
    conn.commit()
    conn.close()
    return {"status": "approved", "count": len(req.messages)}


@app.get("/api/sessions")
async def list_sessions(user: dict = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("""
        SELECT s.*, c.whatsapp_name, c.display_name, c.upi_id,
               d.total_amount, d.amount_recovered, (d.total_amount - d.amount_recovered) as balance,
               (SELECT text FROM chat_messages m WHERE m.session_id = s.id ORDER BY m.rowid DESC LIMIT 1) as last_message_text
        FROM reminder_sessions s
        JOIN contacts c ON s.contact_id = c.id
        JOIN debts d ON s.debt_id = d.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    """, (uid(user),)).fetchall()
    conn.close()
    res = []
    for r in rows:
        d = dict(r)
        d["approved_messages"] = json.loads(d["approved_messages"]) if d["approved_messages"] else []
        d["seconds_until_next_reminder"] = seconds_until(d.get("next_reminder_at"))
        res.append(d)
    return res


@app.get("/api/sessions/{id}/messages")
async def get_session_messages(id: str, user: dict = Depends(get_current_user)):
    conn = get_db()
    owned = conn.execute("SELECT id FROM reminder_sessions WHERE id = ? AND user_id = ?", (id, uid(user))).fetchone()
    if not owned:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    rows = conn.execute("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY rowid ASC", (id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/sessions/{id}/pause")
async def pause_session(id: str, user: dict = Depends(get_current_user)):
    await session_mgr.pause_session(id)
    return {"status": "paused"}


@app.post("/api/sessions/{id}/resume")
async def resume_session(id: str, user: dict = Depends(get_current_user)):
    await session_mgr.resume_session(id)
    return {"status": "resumed"}


@app.post("/api/sessions/{id}/stop")
async def stop_session(id: str, user: dict = Depends(get_current_user)):
    await session_mgr.stop_session(id)
    return {"status": "stopped"}


@app.post("/api/sessions/{id}/confirm-close")
async def confirm_close_account(id: str, req: ConfirmCloseRequest, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT debt_id, (SELECT (total_amount - amount_recovered) FROM debts WHERE id = reminder_sessions.debt_id) as balance
        FROM reminder_sessions WHERE id = ? AND user_id = ?
    """, (id, uid(user)))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    debt_id = row["debt_id"]
    payment_amount = req.payment_amount if req.payment_amount is not None else row["balance"]
    if req.record_payment and payment_amount > 0:
        entry_id = f"ent_{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO debt_entries (id, debt_id, user_id, entry_type, amount, comment, entry_date, created_by)
            VALUES (?, ?, ?, 'payment', ?, ?, ?, ?)
        """, (entry_id, debt_id, uid(user), payment_amount, req.payment_comment, date.today().isoformat(), uid(user)))
        conn.commit()
    conn.close()
    recalc_debt_totals(debt_id, uid(user))
    await session_mgr.stop_session(id)
    return {"status": "closed", "debt_id": debt_id, "payment_recorded": req.record_payment, "amount": payment_amount}


@app.post("/api/sessions/{id}/simulate-reply")
async def simulate_session_reply(id: str, req: SimulateReplyRequest, user: dict = Depends(get_current_user)):
    text = req.reply_text or req.text or ""
    return await session_mgr.handle_incoming_reply(id, text)


@app.get("/api/qr/{filename}")
async def get_qr(filename: str):
    file_path = os.path.join(QR_DIR, os.path.basename(filename))
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="QR image not found")


@app.websocket("/ws/live")
@app.websocket("/ws/live/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: Optional[str] = None):
    await websocket.accept()
    session_mgr.register_ws(websocket, user_id)
    try:
        await websocket.send_json({
            "type": "welcome",
            "message": "Connected to Paisa Dede Bhai v2 Live Stream (ZQG365 Application Services)",
        })
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        session_mgr.unregister_ws(websocket, user_id)
    except Exception:
        session_mgr.unregister_ws(websocket, user_id)


frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
