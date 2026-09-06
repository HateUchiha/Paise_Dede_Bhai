import asyncio
import json
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from db import get_db, deduct_user_quota, get_user_quota
from intent_analyzer import analyze_incoming_reply
from whatsapp_manager import whatsapp_mgr



class SessionRunner:
    def __init__(self, session_id: str, manager: Any):
        self.session_id = session_id
        self.manager = manager
        self.is_running = False
        self.task: Optional[asyncio.Task] = None

    async def start(self):
        self.is_running = True
        self.task = asyncio.create_task(self._run_loop())

    async def stop(self):
        self.is_running = False
        if self.task and not self.task.done():
            self.task.cancel()

    def _load_row(self):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, c.whatsapp_name, c.display_name, c.upi_id, d.total_amount, d.amount_recovered
            FROM reminder_sessions s
            JOIN contacts c ON s.contact_id = c.id
            JOIN debts d ON s.debt_id = d.id
            WHERE s.id = ?
        """, (self.session_id,))
        row = cursor.fetchone()
        conn.close()
        return row

    async def _run_loop(self):
        try:
            row = self._load_row()
            if not row:
                return

            approved_msgs = json.loads(row["approved_messages"]) if row["approved_messages"] else []
            if not approved_msgs:
                await self.manager.broadcast({
                    "type": "session_aborted",
                    "session_id": self.session_id,
                    "reason": "No approved messages in the guardrail pool.",
                    "user_id": row["user_id"],
                })
                return

            interval_sec = max(15 * 60, int(row["interval_minutes"] or 15) * 60)
            balance = row["total_amount"] - row["amount_recovered"]
            contact_name = row["whatsapp_name"]
            is_first = row["reminders_sent"] == 0

            while self.is_running:
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT status, reminders_sent, current_msg_index, qr_filename, user_id FROM reminder_sessions WHERE id = ?",
                    (self.session_id,),
                )
                curr = cursor.fetchone()
                if not curr or curr["status"] != "active":
                    conn.close()
                    break

                ok, detail = whatsapp_mgr.find_chat_smart(contact_name)
                if not ok:
                    conn.close()
                    await self.manager.broadcast({
                        "type": "session_aborted",
                        "session_id": self.session_id,
                        "reason": detail,
                        "user_id": curr["user_id"],
                    })
                    await self.manager.pause_session(self.session_id)
                    break

                quota_info = get_user_quota(curr["user_id"])
                if quota_info["remaining"] <= 0:
                    conn.close()
                    await self.manager.broadcast({
                        "type": "quota_exhausted",
                        "session_id": self.session_id,
                        "user_id": curr["user_id"],
                        "message": "Meta WhatsApp Free Tier 1,000 message limit reached."
                    })
                    await self.manager.pause_session(self.session_id)
                    break

                reminders_sent = curr["reminders_sent"] + 1
                msg_idx = curr["current_msg_index"] % len(approved_msgs)
                msg_text = approved_msgs[msg_idx]
                next_msg_idx = (msg_idx + 1) % len(approved_msgs)
                qr_filename = curr["qr_filename"]

                sent_ok, send_detail = whatsapp_mgr.send_approved_message(contact_name, msg_text)
                if not sent_ok:
                    conn.close()
                    await self.manager.broadcast({
                        "type": "session_aborted",
                        "session_id": self.session_id,
                        "reason": send_detail,
                        "user_id": curr["user_id"],
                    })
                    await self.manager.pause_session(self.session_id)
                    break

                now_str = datetime.now().strftime("%I:%M %p")
                msg_id = f"msg_{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                    INSERT INTO chat_messages (id, session_id, sender, text, message_type, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (msg_id, self.session_id, "bot", msg_text, "reminder", now_str))

                qr_msg_id = None
                if is_first and qr_filename:
                    qr_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
                    qr_text = f"Here is the payment QR code for Rs. {balance:.2f}. Please scan and pay."
                    cursor.execute("""
                        INSERT INTO chat_messages (id, session_id, sender, text, message_type, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (qr_msg_id, self.session_id, "bot", qr_text, "qr_sent", now_str))
                    whatsapp_mgr.send_qr_image(contact_name, qr_filename)

                # Deduct from user's Meta WhatsApp 1,000 message quota
                deduct_count = 2 if (is_first and qr_filename) else 1
                updated_quota = deduct_user_quota(curr["user_id"], deduct_count)

                next_reminder_at = time.time() + interval_sec
                cursor.execute("""
                    UPDATE reminder_sessions
                    SET reminders_sent = ?, current_msg_index = ?, next_reminder_at = ?
                    WHERE id = ?
                """, (reminders_sent, next_msg_idx, datetime.fromtimestamp(next_reminder_at).isoformat(), self.session_id))
                conn.commit()
                conn.close()

                # Broadcast real-time quota reduction
                await self.manager.broadcast({
                    "type": "quota_updated",
                    "user_id": curr["user_id"],
                    "quota": updated_quota["quota"],
                    "used": updated_quota["used"],
                    "remaining": updated_quota["remaining"],
                })

                await self.manager.broadcast({
                    "type": "new_message",
                    "session_id": self.session_id,

                    "user_id": curr["user_id"],
                    "message": {
                        "id": msg_id,
                        "session_id": self.session_id,
                        "sender": "bot",
                        "text": msg_text,
                        "message_type": "reminder",
                        "timestamp": now_str,
                    },
                })

                if qr_msg_id:
                    await self.manager.broadcast({
                        "type": "new_message",
                        "session_id": self.session_id,
                        "user_id": curr["user_id"],
                        "message": {
                            "id": qr_msg_id,
                            "session_id": self.session_id,
                            "sender": "bot",
                            "text": f"Here is the payment QR code for Rs. {balance:.2f}. Please scan and pay.",
                            "message_type": "qr_sent",
                            "qr_filename": qr_filename,
                            "timestamp": now_str,
                        },
                    })

                await self.manager.broadcast({
                    "type": "session_updated",
                    "session_id": self.session_id,
                    "user_id": curr["user_id"],
                    "reminders_sent": reminders_sent,
                    "seconds_until_next": interval_sec,
                })

                is_first = False
                await asyncio.sleep(interval_sec)

        except asyncio.CancelledError:
            pass


class SessionManager:
    def __init__(self):
        self.active_runners: Dict[str, SessionRunner] = {}
        self.ws_clients: List[Any] = []
        self.ws_by_user: Dict[str, List[Any]] = {}

    async def broadcast(self, data: dict, user_id: Optional[str] = None):
        target_user = user_id or data.get("user_id")
        sockets = list(self.ws_clients)
        if target_user and target_user in self.ws_by_user:
            sockets = list(self.ws_by_user[target_user]) or sockets
        dead = []
        for ws in sockets:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for d in dead:
            if d in self.ws_clients:
                self.ws_clients.remove(d)
            for uid, group in self.ws_by_user.items():
                if d in group:
                    group.remove(d)

    def register_ws(self, websocket, user_id: Optional[str] = None):
        self.ws_clients.append(websocket)
        if user_id:
            self.ws_by_user.setdefault(user_id, []).append(websocket)

    def unregister_ws(self, websocket, user_id: Optional[str] = None):
        if websocket in self.ws_clients:
            self.ws_clients.remove(websocket)
        if user_id and user_id in self.ws_by_user and websocket in self.ws_by_user[user_id]:
            self.ws_by_user[user_id].remove(websocket)

    async def start_session(self, session_id: str):
        if session_id in self.active_runners:
            await self.active_runners[session_id].stop()
        runner = SessionRunner(session_id, self)
        self.active_runners[session_id] = runner
        await runner.start()

    async def pause_session(self, session_id: str):
        if session_id in self.active_runners:
            await self.active_runners[session_id].stop()
            del self.active_runners[session_id]
        conn = get_db()
        conn.execute("UPDATE reminder_sessions SET status = 'paused' WHERE id = ?", (session_id,))
        conn.commit()
        conn.close()
        await self.broadcast({"type": "session_status_changed", "session_id": session_id, "status": "paused"})

    async def resume_session(self, session_id: str):
        conn = get_db()
        conn.execute("UPDATE reminder_sessions SET status = 'active' WHERE id = ?", (session_id,))
        conn.commit()
        conn.close()
        await self.start_session(session_id)
        await self.broadcast({"type": "session_status_changed", "session_id": session_id, "status": "active"})

    async def stop_session(self, session_id: str):
        if session_id in self.active_runners:
            await self.active_runners[session_id].stop()
            del self.active_runners[session_id]
        conn = get_db()
        conn.execute("UPDATE reminder_sessions SET status = 'closed' WHERE id = ?", (session_id,))
        conn.commit()
        conn.close()
        await self.broadcast({"type": "session_status_changed", "session_id": session_id, "status": "closed"})

    async def handle_incoming_reply(self, session_id: str, reply_text: str):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, c.whatsapp_name, c.display_name, c.upi_id, d.id as debt_id, d.total_amount, d.amount_recovered
            FROM reminder_sessions s
            JOIN contacts c ON s.contact_id = c.id
            JOIN debts d ON s.debt_id = d.id
            WHERE s.id = ?
        """, (session_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return {"error": "Session not found"}

        balance = row["total_amount"] - row["amount_recovered"]
        analysis = analyze_incoming_reply(reply_text, balance)
        now_str = datetime.now().strftime("%I:%M %p")

        msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO chat_messages (id, session_id, sender, text, message_type, analyzed_intent, intent_date, raw_response, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (msg_id, session_id, "contact", reply_text, "reply", analysis["intent"], analysis.get("extracted_date"), reply_text, now_str))
        conn.commit()

        await self.broadcast({
            "type": "new_message",
            "session_id": session_id,
            "user_id": row["user_id"],
            "message": {
                "id": msg_id,
                "session_id": session_id,
                "sender": "contact",
                "text": reply_text,
                "message_type": "reply",
                "analyzed_intent": analysis["intent"],
                "intent_date": analysis.get("extracted_date"),
                "timestamp": now_str,
            },
        })

        if analysis["intent"] == "paid":
            if session_id in self.active_runners:
                await self.active_runners[session_id].stop()
                del self.active_runners[session_id]
            cursor.execute("UPDATE reminder_sessions SET status = 'payment_detected' WHERE id = ?", (session_id,))
            conn.commit()
            alert_payload = {
                "type": "alert_payment_cross_confirm",
                "session_id": session_id,
                "user_id": row["user_id"],
                "contact_name": row["whatsapp_name"],
                "debt_id": row["debt_id"],
                "balance": balance,
                "reply_text": reply_text,
                "explanation": analysis["explanation"],
            }
            await self.broadcast(alert_payload)
            conn.close()
            return alert_payload

        if analysis["intent"] == "will_pay_date":
            cursor.execute("UPDATE reminder_sessions SET status = 'promise_detected' WHERE id = ?", (session_id,))
            conn.commit()
            alert_payload = {
                "type": "alert_promise_date",
                "session_id": session_id,
                "user_id": row["user_id"],
                "contact_name": row["whatsapp_name"],
                "debt_id": row["debt_id"],
                "promised_date": analysis["extracted_date"],
                "reply_text": reply_text,
                "explanation": analysis["explanation"],
            }
            await self.broadcast(alert_payload)
            conn.close()
            return alert_payload

        if analysis["intent"] == "will_pay_future":
            alert_payload = {
                "type": "alert_vague_promise",
                "session_id": session_id,
                "user_id": row["user_id"],
                "contact_name": row["whatsapp_name"],
                "reply_text": reply_text,
                "explanation": analysis["explanation"],
            }
            await self.broadcast(alert_payload)
            conn.close()
            return alert_payload

        if analysis["intent"] == "refused":
            alert_payload = {
                "type": "alert_refusal",
                "session_id": session_id,
                "user_id": row["user_id"],
                "contact_name": row["whatsapp_name"],
                "reply_text": reply_text,
                "explanation": analysis["explanation"],
            }
            await self.broadcast(alert_payload)
            conn.close()
            return alert_payload

        if analysis["intent"] == "qr_request" and row["qr_filename"]:
            qr_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
            qr_text = f"Here is the QR code for Rs. {balance:.2f}. Please scan and pay! 🙏"
            cursor.execute("""
                INSERT INTO chat_messages (id, session_id, sender, text, message_type, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (qr_msg_id, session_id, "bot", qr_text, "qr_sent", now_str))
            conn.commit()
            whatsapp_mgr.send_qr_image(row["whatsapp_name"], row["qr_filename"])
            await self.broadcast({
                "type": "new_message",
                "session_id": session_id,
                "user_id": row["user_id"],
                "message": {
                    "id": qr_msg_id,
                    "session_id": session_id,
                    "sender": "bot",
                    "text": qr_text,
                    "message_type": "qr_sent",
                    "qr_filename": row["qr_filename"],
                    "timestamp": now_str,
                },
            })
            conn.close()
            return {"action": "qr_sent"}

        conn.close()
        return {"action": "reply_logged", "analysis": analysis}


session_mgr = SessionManager()
