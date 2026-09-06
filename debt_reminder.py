from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import time
import random
from datetime import datetime
import os
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from PIL import Image
import uuid



options = webdriver.ChromeOptions()
options.add_argument(r"--user-data-dir=C:\selenium\whatsapp_profile")
driver = webdriver.Chrome(options=options)
driver.get("https://web.whatsapp.com")

print("Opening WhatsApp Web...")
time.sleep(5)

input("\nIf QR code appears, scan it.\nPress Enter to continue...")



def generate_upi_qr(upi_id, name, amount=None):
    """Generate UPI QR code"""
    try:
        qr_dir = 'qr_codes'
        if not os.path.exists(qr_dir):
            os.makedirs(qr_dir)
        
        upi_url = f"upi://pay?pa={upi_id}&pn={name}"
        if amount:
            upi_url += f"&am={amount}"
        
        filename = f"upi_qr_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(qr_dir, filename)
        
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
        print(f"✅ QR code saved: {filepath}")
        return filepath, filename
    except Exception as e:
        print(f"❌ Error generating QR: {e}")
        return None, None


def click_element_safely(element):
    """Click an element safely using multiple methods"""
    try:
        
        element.click()
        return True
    except:
        try:
    
            driver.execute_script("arguments[0].click();", element)
            return True
        except:
            try:
                
                actions = ActionChains(driver)
                actions.move_to_element(element).click().perform()
                return True
            except:
                try:
                    
                    WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, f'//span[text()="{element.text}"]'))
                    ).click()
                    return True
                except:
                    return False

def find_chat_smart(name):
    """Smart chat finder - FIXED VERSION"""
    try:
        print(f"\n🔍 Searching for '{name}'...")
        
        
        time.sleep(3)
        
        
        chat_found = False
        chat_element = None
        
        
        xpath_variations = [
            f'//span[normalize-space(text())="{name}"]',
            f'//span[contains(text(), "{name}")]',
            f'//div[contains(@class, "_ak8q")]//span[contains(text(), "{name}")]',
            f'//div[@role="row"]//span[contains(text(), "{name}")]'
        ]
        
        for xpath in xpath_variations:
            try:
                elements = driver.find_elements(By.XPATH, xpath)
                if elements:
                    print(f"✅ Found {len(elements)} match(es) with XPATH: {xpath}")
                    for el in elements:
                        print(f"   - {el.text}")
                    chat_element = elements[0]
                    chat_found = True
                    break
            except:
                continue
        
        if chat_found and chat_element:
            print(f"✅ Found chat: {chat_element.text}")
            
            if click_element_safely(chat_element):
                print(f"✅ Opened chat with: {chat_element.text}")
                time.sleep(2)
                return True
            else:
                print("⚠️ Found but couldn't click. Trying alternative...")
        
        
        try:
            print("🔄 Trying alternative click method...")
            chat_divs = driver.find_elements(By.XPATH, f'//div[contains(@class, "_ak8q")]')
            for div in chat_divs:
                try:
                    span = div.find_element(By.XPATH, './/span[contains(text(), "' + name + '")]')
                    if span:
                        print(f"✅ Found chat via div: {span.text}")
                        if click_element_safely(div):
                            print(f"✅ Opened chat: {span.text}")
                            time.sleep(2)
                            return True
                except:
                    continue
        except:
            pass
        
        
        try:
            print("🔄 Trying search method...")
            search_box = driver.find_element(By.XPATH, '//div[@contenteditable="true"][@role="textbox"]')
            search_box.click()
            search_box.clear()
            search_box.send_keys(name)
            time.sleep(3)
            
            
            results = driver.find_elements(By.XPATH, '//span[contains(text(), "' + name + '")]')
            if results:
                print(f"✅ Found {len(results)} search results")
                for result in results:
                    print(f"   - {result.text}")
                    if click_element_safely(result):
                        print(f"✅ Opened chat via search: {result.text}")
                        time.sleep(2)
                        return True
        except Exception as e:
            print(f"⚠️ Search method failed: {e}")
        
        
        try:
            print("\n📋 Showing all contacts...")
            
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            
            all_contacts = driver.find_elements(By.XPATH, '//div[contains(@class, "_ak8q")]//span[@dir="auto"]')
            visible_contacts = []
            for contact in all_contacts:
                text = contact.text.strip()
                if text and text not in visible_contacts:
                    visible_contacts.append(text)
            
            if visible_contacts:
                print(f"\n📋 Found {len(visible_contacts)} contacts:")
                for i, contact in enumerate(visible_contacts[:20]):
                    print(f"   {i+1}. {contact}")
                
                choice = input(f"\nEnter number (1-{min(20, len(visible_contacts))}) or press Enter to cancel: ")
                if choice.isdigit() and 1 <= int(choice) <= min(20, len(visible_contacts)):
                    selected_name = visible_contacts[int(choice)-1]
                    
                    contacts = driver.find_elements(By.XPATH, f'//span[text()="{selected_name}"]')
                    if contacts:
                        if click_element_safely(contacts[0]):
                            print(f"✅ Opened chat: {selected_name}")
                            time.sleep(2)
                            return True
        except Exception as e:
            print(f"⚠️ Contacts list method failed: {e}")
        
        print(f"\n❌ Could not find chat: {name}")
        print("\n💡 Tips:")
        print("1. The contact name might have emojis or special characters")
        print("2. Try using a shorter version of the name")
        print("3. Check if the contact exists in your WhatsApp")
        print("4. Make sure you've scanned the QR code")
        return False
        
    except Exception as e:
        print(f"❌ Error finding chat: {e}")
        return False

def get_debt_info():
    print("\n" + "="*60)
    print("💰 PAISA DE DE BHAIII  💰")
    print("="*60)
    
    name = input("\nEnter contact's name (as shown in WhatsApp): ").strip()
    if not name:
        print("❌ Name cannot be empty!")
        exit()
    
    while True:
        try:
            amount = float(input("Enter the amount that bastard owes you 🤬 : ").strip())
            if amount <= 100:
                print("❌ Amount must be greater than 100!")
                continue
            break
        except ValueError:
            print("❌ Please enter a valid number!")
    
    print("\n📱 UPI QR SETUP")
    print("If you want to auto-send QR when asked, enter your UPI ID")
    upi_id = input("Enter UPI ID (press Enter to skip): ").strip()
    
    print("\nHow often should I remind them? ⌛")
    print("1. Every 30 minutes")
    print("2. Every 1 hour")
    print("3. Every 2 hours")
    print("4. Every 4 hours")
    print("5. Every 6 hours")
    print("6. Custom (enter your own minutes)")
    
    freq_choice = input("Select option (1-6): ").strip()
    
    freq_map = {
        '1': 30,
        '2': 60,
        '3': 120,
        '4': 240,
        '5': 360,
    }
    
    if freq_choice == '6':
        minutes = int(input("Enter minutes between reminders: "))
        reminder_interval = minutes * 60
    else:
        reminder_interval = freq_map.get(freq_choice, 60) * 60
    
    return name, amount, reminder_interval, upi_id


def send_message(message):
    """Send a message to the chat"""
    try:
        message_box = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located(
                (By.XPATH, '//div[@contenteditable="true"][@role="textbox"]')
            )
        )
        message_box.click()
        message_box.clear()
        message_box.send_keys(message)
        message_box.send_keys("\n")
        time.sleep(1)
        return True
    except Exception as e:
        print(f"❌ Error sending message: {type(e).__name__}")
        return False

def send_qr_code(qr_path):
    """Send QR code image via WhatsApp"""
    try:
        print("📤 Attempting to send QR code...")
        
        attach_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//div[@title="Attach"]'))
        )
        attach_button.click()
        print("✅ Attach button clicked")
        time.sleep(2)
        
        file_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located(
                (By.XPATH, '//input[@accept="image/*,video/mp4,video/3gpp,video/quicktime"]')
            )
        )
        
        absolute_path = os.path.abspath(qr_path)
        print(f"📁 Uploading: {absolute_path}")
        file_input.send_keys(absolute_path)
        print("✅ File uploaded")
        time.sleep(3)
        
        send_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//span[@data-icon="send"]'))
        )
        send_button.click()
        print("✅ QR code sent successfully!")
        time.sleep(2)
        return True
        
    except Exception as e:
        print(f"❌ Error sending QR: {type(e).__name__}")
        return False


def get_all_messages():
    """Get all messages from the chat"""
    try:
        messages = driver.find_elements(By.XPATH, '//div[contains(@class, "message-in")]')
        if messages:
            return messages
        
        messages = driver.find_elements(By.XPATH, '//div[contains(@data-testid, "msg-container")]//div[contains(@class, "message-in")]')
        if messages:
            return messages
        
        messages = driver.find_elements(By.XPATH, '//div[contains(@class, "copyable-text")]')
        return messages
    except Exception as e:
        return []

def get_last_message():
    """Get the last message from the contact"""
    try:
        messages = get_all_messages()
        if messages:
            last_msg = messages[-1]
            text = last_msg.text.strip()
            if text:
                return text
        return None
    except Exception as e:
        return None


def check_for_qr_request(reply_text):
    """Check if reply is asking for QR/UPI"""
    if not reply_text:
        return False
        
    qr_phrases = [
        'send qr', 'qr send', 'qr code', 'upi id', 'upi',
        'payment id', 'pay id', 'scan code', 'scan qr',
        'give qr', 'share qr', 'send upi', 'qr please',
        'what is your upi', 'upi number', 'payment link',
        'pay link', 'qr kya hai', 'upi kya hai',
        'gpay', 'phonepe', 'paytm', 'google pay', 'phone pay',
        'qr bhejo', 'upi bhejo', 'scan', 'code',
        'upi de', 'qr de', 'pay kaise', 'how to pay',
        'upi id kya hai', 'qr code bhejo'
    ]
    
    reply_lower = reply_text.lower()
    
    for phrase in qr_phrases:
        if phrase in reply_lower:
            print(f"🔍 QR keyword detected: '{phrase}'")
            return True
    
    return False

def check_payment_confirmation(reply_text, amount):
    """Check if the reply indicates payment has been made"""
    if not reply_text:
        return False
        
    paid_phrases = [
        'i paid', 'i have paid', 'i returned', 'i have returned',
        'i sent', 'i have sent', 'already paid', 'already returned',
        'paid already', 'returned already', 'i pay', 'i have pay',
        'pay kar diya', 'bhej diya', 'de diya', 'send kar diya',
        'kar diya', 'ho gaya', 'done', 'paid hai',
        'paid', 'sent', 'transferred', 'settled',
        'payment done', 'pay done', 'money sent',
        'pathiye diyechi', 'diye diyechi', 'check gpay',
        'dekhene', 'kar diya hai', 'bhej diya hai',
        'de diya hai', 'transfer kar diya', 'send kar diya',
        'payment kar diya', 'pay kar diya', 'money bhej diya'
    ]
    
    reply_lower = reply_text.lower()
    
    for phrase in paid_phrases:
        if phrase in reply_lower:
            if 'let me know' in reply_lower or 'when' in reply_lower:
                continue
            if '?' in reply_lower:
                continue
            print(f"✅ Payment phrase detected: '{phrase}'")
            return True
    
    amount_str = str(amount)
    amount_int = str(int(amount))
    if amount_str in reply_lower or amount_int in reply_lower:
        if any(word in reply_lower for word in ['paid', 'sent', 'bhej', 'de', 'pay', 'transfer']):
            print(f"✅ Amount {amount} mentioned with payment keyword")
            return True
    
    return False

def format_amount(amount):
    return f"₹{amount:.2f}"

def get_reminder_message(amount, reminder_count):
    templates = [
        f"Hey! Just a gentle reminder about the {format_amount(amount)} you owe me. 😊",
        f"Hi! Quick reminder: {format_amount(amount)} please. Thanks! 🙏",
        f"Hello! Remember the {format_amount(amount)}? When can you send it? 😅",
        f"Hey! Hope you're doing well. Any update on the {format_amount(amount)}?",
        f"Hi there! Just checking in about the {format_amount(amount)}. No rush, but let me know!",
        f"Hey! 🤗 Quick ping about the {format_amount(amount)} you borrowed.",
        f"Hello! Reminder #{reminder_count} about {format_amount(amount)}.",
        f"Hi! Can we settle the {format_amount(amount)}? Thanks! 😊",
        f"BHAIIIIII KOBE DIBIIIII AMAR {format_amount(amount)}??? 🤨🤨🤨",
        f"GirlFriend ke ektu coffee khawabo mamaa , amake amar {format_amount(amount)} , ferodh daoo😭😭😭😭😭",
        f"LEWRAAA 24hr modhe naa dile {format_amount(amount)} , GAR BHENGE DEBOO 🤬🤬🤬🤬"
    ]
    return random.choice(templates)

def run_reminder_bot():

    name, amount, interval, upi_id = get_debt_info()
    qr_path = None
    if upi_id:
        print("\n📱 Generating UPI QR code...")
        qr_path, _ = generate_upi_qr(upi_id, name, amount)
        if qr_path:
            print(f"✅ QR code generated! Saved at: {qr_path}")
    
    if not find_chat_smart(name):
        print("\n❌ Could not find the contact.")
        print("\n💡 Try these steps:")
        print("1. Open WhatsApp Web in the browser")
        print("2. Check if the contact exists in your chats")
        print("3. Look at the exact name (includes emojis/characters)")
        print("4. Restart the bot and enter the exact name")
        input("\nPress Enter to exit...")
        driver.quit()
        exit()
    
    print("\n" + "="*60)
    print("✅ BOT CONFIGURED")
    print("="*60)
    print(f"Contact: {name}")
    print(f"Amount: {format_amount(amount)}")
    print(f"Reminder interval: {interval//60} minutes")
    if upi_id and qr_path:
        print(f"UPI ID: {upi_id} ✅")
    print("="*60)
    
    confirm = input("\nStart sending reminders? (y/n): ").lower()
    if confirm != 'y':
        print("❌ Bot cancelled.")
        driver.quit()
        exit()
    
    time.sleep(2)
    
    reminder_count = 1
    reminder_message = get_reminder_message(amount, reminder_count)
    
    print(f"\n🔄 Sending reminder #{reminder_count}...")
    if send_message(reminder_message):
        print(f"✅ Reminder #{reminder_count} sent!")
    
    qr_already_sent = False
    
    time.sleep(3)
    last_message = get_last_message()
    print(f"📝 Initial message: {last_message[:50] if last_message else 'None'}")
    
    try:
        while True:
            print(f"\n⏰ Waiting {interval//60} minutes...")
            print("(Press Ctrl+C to stop)")
            
            check_interval = 5
            total_checks = interval // check_interval
            
            for check_num in range(total_checks):
                time.sleep(check_interval)
                
                if check_num % 6 == 0:
                    print(f"⏳ Checking for replies... ({check_num * check_interval}s elapsed)")
                
                current_message = get_last_message()
                
                if current_message:
                    if last_message is None or current_message != last_message:
                        print(f"\n💬 NEW REPLY DETECTED!")
                        print(f"📝 Reply: {current_message}")
                        
                        reply_lower = current_message.lower()
                        
                        if check_payment_confirmation(reply_lower, amount):
                            print("🎉 PAYMENT CONFIRMED!")
                            print(f"✅ {name} has returned the money!")
                            
                            thank_you = f"Thank you! {format_amount(amount)} received! 🙏"
                            send_message(thank_you)
                            
                            print("\n🎊 Bot stopping - Debt settled!")
                            return True
                        
                        if not qr_already_sent and upi_id and qr_path:
                            if check_for_qr_request(reply_lower):
                                print("🔍 QR CODE REQUESTED!")
                                
                                if send_qr_code(qr_path):
                                    qr_already_sent = True
                                    qr_message = f"Here's my UPI QR code for {format_amount(amount)}. Please scan and pay. 😊"
                                    send_message(qr_message)
                                    print("✅ QR code sent successfully!")
                                else:
                                    fallback_msg = f"Hey! My UPI ID is: {upi_id}. Please send {format_amount(amount)} there. Thanks! 🙏"
                                    send_message(fallback_msg)
                                    qr_already_sent = True
                        
                        last_message = current_message
                        print("📝 Updated last message tracker")
            
            reminder_count += 1
            reminder_message = get_reminder_message(amount, reminder_count)
            
            if reminder_count > 5:
                reminder_message = f"BHAII, holo toh onek khon , pleaseee bhaii , paaye porchi . Taka r khub dorkar . Please {format_amount(amount)} pathiye de bhaii🙏🏾🙏🏾"
            elif reminder_count > 10:
                reminder_message = f"KHANKI R CHELE TAKA FERODH DIBI AMAR??? KOTO DIN LAGEY {format_amount(amount)} ferodh dite???"
            
            print(f"\n🔄 Sending reminder #{reminder_count}...")
            if send_message(reminder_message):
                print(f"✅ Reminder #{reminder_count} sent!")
                
    except KeyboardInterrupt:
        print("\n\n⚠️ Bot stopped by user")
        send_message("⚠️ Reminder bot stopped. We'll talk later! 😊")
        return False

if __name__ == "__main__":
    try:
        success = run_reminder_bot()
        if success:
            print("\n🎉 Mission accomplished!")
        else:
            print("\n👋 Bot stopped.")
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}")
        print(str(e))
    
    input("\nPress Enter to close...")
    driver.quit()
    
    