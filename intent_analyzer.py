import re
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

PAID_PATTERNS = [
    r"\b(paid|already\s+paid|have\s+paid|sent|transferred|settled|cleared)\b",
    r"\b(bhej\s+diya|de\s+diya|pay\s+kar\s+diya|transfer\s+kar\s+diya|kar\s+diya\s+hai|ho\s+gaya|bhej\s+chuka\s+hoon)\b",
    r"\b(pathiye\s+diyechi|diye\s+diyechi|taka\s+diye\s+diyechi)\b",
    r"\b(check\s+gpay|check\s+phonepe|check\s+paytm|check\s+account)\b",
    r"\bpayment\s+done\b"
]

DATE_PATTERNS = [
    (r"\b(tomorrow|kal|kalke|kal\s+subah|kal\s+sham)\b", "Tomorrow"),
    (r"\b(day\s+after\s+tomorrow|parso|porshu)\b", "Day after tomorrow"),
    (r"\b(monday|sombar|somwar)\b", "Monday"),
    (r"\b(tuesday|mongolbar|mangalwar)\b", "Tuesday"),
    (r"\b(wednesday|budhbar|budhwar)\b", "Wednesday"),
    (r"\b(thursday|brihospotibar|guruwar)\b", "Thursday"),
    (r"\b(friday|sukrobar|shukrawar)\b", "Friday"),
    (r"\b(saturday|sonibar|shaniwar)\b", "Saturday"),
    (r"\b(sunday|robibar|ravivar)\b", "Sunday"),
    (r"\b(this\s+weekend|weekend\s+pe)\b", "This Weekend"),
    (r"\b(end\s+of\s+month|month\s+end|mash\s+shesh)\b", "End of this month"),
    (r"\b(salary\s+day|salary\s+ashle|salary\s+milte\s+hi)\b", "Salary day"),
    (r"\b(\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[a-zA-Z]+))\b", "Specific date"),
    (r"\b(\d{1,2}\s*tarikh|\d{1,2}\s*tareekh)\b", "Date of month")
]

FUTURE_PATTERNS = [
    r"\b(will\s+pay|dunga|debo|jaldi\s+dunga|dibo|kichu\s+din|thoda\s+time|wait\s+karo|ek\s+hafta|next\s+week|soon|later)\b",
    r"\b(somoy\s+de|bhalo\s+kore\s+bhabchi|thoda\s+ruk|paisa\s+aane\s+de)\b"
]

QR_PATTERNS = [
    r"\b(send\s+qr|qr\s+send|qr\s+code|qr\s+bhejo|qr\s+de|qr\s+patha|upi\s+id|upi\s+bhejo|how\s+to\s+pay|pay\s+kaise\s+karein)\b"
]

REFUSAL_PATTERNS = [
    r"\b(nahi\s+dunga|debona|bhul\s+ja|kono\s+taka\s+nei|paisa\s+nahi\s+hai|won'?t\s+pay|can'?t\s+pay)\b"
]

def analyze_incoming_reply(text: str, debt_amount: Optional[float] = None) -> Dict[str, Any]:
    if not text:
        return {
            "intent": "unknown",
            "confidence": 0.0,
            "extracted_date": None,
            "explanation": "Empty message",
            "suggested_action": "continue"
        }

    lower = text.lower().strip()

    # Rule out questions or hypothetical queries
    is_question = "?" in lower or lower.startswith("when") or "kobe" in lower

    # 1. Check for QR request first
    for pat in QR_PATTERNS:
        if re.search(pat, lower):
            return {
                "intent": "qr_request",
                "confidence": 0.95,
                "extracted_date": None,
                "explanation": "Contact explicitly requested payment QR or UPI details.",
                "suggested_action": "send_qr"
            }

    # 2. Check for Paid confirmation (if not asking a question)
    if not is_question:
        for pat in PAID_PATTERNS:
            if re.search(pat, lower):
                return {
                    "intent": "paid",
                    "confidence": 0.92,
                    "extracted_date": None,
                    "explanation": "Message contains clear payment confirmation keywords.",
                    "suggested_action": "alert_payment_cross_confirm"
                }

        # If debt amount is mentioned alongside 'paid/sent'
        if debt_amount and (str(int(debt_amount)) in lower or f"{debt_amount:.0f}" in lower):
            if any(w in lower for w in ["bhej", "paid", "sent", "done", "transfer"]):
                return {
                    "intent": "paid",
                    "confidence": 0.90,
                    "extracted_date": None,
                    "explanation": f"Contact mentioned exact amount (Rs. {debt_amount:.0f}) with payment action.",
                    "suggested_action": "alert_payment_cross_confirm"
                }

    # 3. Check for specific promise date
    for pat, label in DATE_PATTERNS:
        match = re.search(pat, lower)
        if match:
            extracted = match.group(0)
            return {
                "intent": "will_pay_date",
                "confidence": 0.88,
                "extracted_date": label if label != "Specific date" else extracted,
                "explanation": f"Contact promised to pay by {label} ('{extracted}').",
                "suggested_action": "alert_promise_date"
            }

    # 4. Check for refusal first before vague promises
    for pat in REFUSAL_PATTERNS:
        if re.search(pat, lower):
            return {
                "intent": "refused",
                "confidence": 0.85,
                "extracted_date": None,
                "explanation": "Contact appears unwilling or unable to pay.",
                "suggested_action": "alert_refusal"
            }

    # 5. Check for general future promise
    for pat in FUTURE_PATTERNS:
        if re.search(pat, lower):
            return {
                "intent": "will_pay_future",
                "confidence": 0.75,
                "extracted_date": "Future date (unspecified)",
                "explanation": "Contact made an uncommitted future payment promise.",
                "suggested_action": "alert_vague_promise"
            }


    return {
        "intent": "unknown",
        "confidence": 0.3,
        "extracted_date": None,
        "explanation": "No clear payment, promise, or refusal keywords detected.",
        "suggested_action": "continue"
    }

if __name__ == "__main__":
    test_cases = [
        "bhej diya hai bhai check karle",
        "send qr code please",
        "kal pakka de dunga bhai 100% promise",
        "thoda time do next week de dunga",
        "nahi dunga jo ukhadna hai ukhad le"
    ]
    for tc in test_cases:
        res = analyze_incoming_reply(tc, 1500)
        print(f"Text: '{tc}' -> Intent: {res['intent']}, Action: {res['suggested_action']}")
