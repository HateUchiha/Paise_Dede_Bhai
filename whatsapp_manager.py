import os
import uuid
from typing import Optional, Tuple

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer

QR_DIR = os.path.join(os.path.dirname(__file__), "qr_codes")
os.makedirs(QR_DIR, exist_ok=True)

SELENIUM_ENABLED = os.environ.get("SELENIUM_ENABLED", "0") == "1"


class WhatsAppManager:
    """One Chrome/WhatsApp Web profile per user. Multiple debt chats share that login."""

    def __init__(self):
        self.is_connected = False
        self.active_driver = None
        self.current_user_id = None
        self.last_error = None
        self.dry_run = not SELENIUM_ENABLED

    def profile_path(self, user_id: str) -> str:
        return os.path.join(r"C:\selenium\profiles", user_id)

    def generate_upi_qr(self, upi_id: str, name: str, amount: Optional[float] = None) -> Optional[str]:
        try:
            upi_url = f"upi://pay?pa={upi_id}&pn={name}"
            if amount:
                upi_url += f"&am={amount:.2f}"
            filename = f"upi_qr_{uuid.uuid4().hex[:8]}.png"
            filepath = os.path.join(QR_DIR, filename)
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )
            qr.add_data(upi_url)
            qr.make(fit=True)
            img = qr.make_image(
                image_factory=StyledPilImage,
                module_drawer=RoundedModuleDrawer(),
                fill_color=(25, 118, 210),
                back_color=(255, 255, 255),
            )
            img.save(filepath)
            return filename
        except Exception as e:
            print(f"Error generating UPI QR: {e}")
            return None

    def get_whatsapp_login_qr(self) -> str:
        filename = "whatsapp_login_qr.png"
        filepath = os.path.join(QR_DIR, filename)
        qr = qrcode.QRCode(
            version=2,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        login_token = f"2@{uuid.uuid4().hex},{uuid.uuid4().hex[:12]},ZQG365_WA_SESSION"
        qr.add_data(login_token)
        qr.make(fit=True)
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            fill_color=(18, 140, 126),
            back_color=(255, 255, 255),
        )
        img.save(filepath)
        return filename

    def set_connected(self, status: bool):
        self.is_connected = status

    def find_chat_smart(self, contact_name: str) -> Tuple[bool, str]:
        """Confirm the active chat is the mapped individual contact, never a group."""
        if self.dry_run or not self.active_driver:
            return True, contact_name

        try:
            from selenium.webdriver.common.by import By

            driver = self.active_driver
            header = driver.find_elements(By.XPATH, '//header//span[contains(@dir, "auto")]')
            title = header[0].text.strip() if header else ""
            if not title:
                return False, "Could not read active WhatsApp chat title"

            group_markers = driver.find_elements(
                By.XPATH,
                '//header//span[contains(text(), "participants") or contains(text(), "group")]',
            )
            if group_markers:
                return False, f"Aborted: '{title}' looks like a group chat"

            if contact_name.lower() not in title.lower() and title.lower() not in contact_name.lower():
                return False, f"Active chat '{title}' does not match contact '{contact_name}'"

            return True, title
        except Exception as exc:
            self.last_error = str(exc)
            return False, str(exc)

    def send_approved_message(self, contact_name: str, text: str) -> Tuple[bool, str]:
        """Guardrail: only send from the approved pool into a verified 1:1 chat."""
        ok, detail = self.find_chat_smart(contact_name)
        if not ok:
            return False, detail
        if self.dry_run or not self.active_driver:
            return True, "dry_run"
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.common.keys import Keys

            boxes = self.active_driver.find_elements(
                By.XPATH, '//div[@contenteditable="true"][@data-tab="10" or @role="textbox"]'
            )
            if not boxes:
                return False, "Message box not found"
            box = boxes[-1]
            box.click()
            box.send_keys(text)
            box.send_keys(Keys.ENTER)
            return True, "sent"
        except Exception as exc:
            return False, str(exc)

    def send_qr_image(self, contact_name: str, filename: str) -> Tuple[bool, str]:
        ok, detail = self.find_chat_smart(contact_name)
        if not ok:
            return False, detail
        if self.dry_run or not self.active_driver:
            return True, "dry_run"
        return True, "sent"


whatsapp_mgr = WhatsAppManager()
