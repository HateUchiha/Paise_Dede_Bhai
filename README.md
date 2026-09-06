<div align="center">

<img src="paisa-dede-bhai-logo.png" alt="Paisa Dede Bhai Logo" width="700">

💸 Paisa Dede Bhai

Because "bhai kal de dunga" has gone on for long enough.

A fun little Python bot for reminding your friends about the money they owe you — with WhatsApp automation, recurring reminders, UPI QR support, and automatic payment-reply detection.

</div>

😭 What is this?

Paisa Dede Bhai is a personal WhatsApp automation project built for the classic situation:

"Bhai paisa kab dega?"

Instead of manually sending the same reminder every few hours, the bot can:

Find your friend's WhatsApp chat

Send a reminder automatically

Keep checking for their replies

Send your UPI QR if they ask how to pay

Detect messages that look like payment confirmations

Stop reminding them once they say they've paid

Basically: you stop chasing. The bot takes over.

✨ Features

Feature

What it does

💬 WhatsApp automation

Sends messages through WhatsApp Web

🔍 Smart chat search

Uses multiple strategies to find your friend's chat

⏰ Recurring reminders

Choose from 30 min, 1 hr, 2 hr, 4 hr, 6 hr, or custom intervals

🎲 Random reminders

Picks from different reminder messages

💸 UPI QR generation

Creates a payment QR for the amount owed

📲 QR-on-request

Sends the QR when your friend asks for it

✅ Payment detection

Looks for common "paid/sent/bhej diya" replies

🛑 Auto-stop

Stops the reminder loop after a likely payment confirmation

🔐 Persistent login

Keeps a dedicated Chrome profile so you don't have to scan WhatsApp every run

🧠 How it works

                    START
                      │
                      ▼
              Open WhatsApp Web
                      │
                      ▼
             Load saved Chrome profile
                      │
                      ▼
              Enter debt information
             ┌────────┼─────────┐
             │        │         │
          Friend    Amount     UPI ID
             │        │       (optional)
             └────────┼─────────┘
                      ▼
               Generate QR
              (if UPI given)
                      │
                      ▼
              Find friend's chat
                      │
                      ▼
             Send first reminder
                      │
                      ▼
              Keep checking chat
                 ┌────┴────┐
                 │         │
           "I paid"     "Send QR"
                 │         │
                 ▼         ▼
            Say thanks   Send QR
                 │         │
                 ▼         │
               STOP ◄──────┘
                 ▲
                 │
             No payment?
                 │
                 ▼
          Wait for interval
                 │
                 ▼
          Send another reminder
                 │
                 └──────────► repeat

🛠️ Tech Stack

Python

Selenium — browser automation

WhatsApp Web — messaging interface

qrcode — UPI QR generation

Pillow — QR/image handling

Chrome — automated browser

🚀 Getting Started

1. Install Python

Make sure Python 3.8+ is installed.

Check:

python --version

2. Install dependencies

pip install selenium qrcode pillow

3. Run the bot

python debt_reminder.py

📱 First-time WhatsApp setup

When the program starts, it opens WhatsApp Web.

If WhatsApp asks you to scan the login QR:

Open WhatsApp on your phone.

Go to Linked Devices.

Link the browser.

Return to the terminal.

Press Enter.

The bot uses a dedicated Chrome profile:

C:\selenium\whatsapp_profile

That profile stores the WhatsApp Web session, so subsequent runs can usually reuse the login.

💰 Setting up a debt reminder

The bot asks you for four things.

1. Friend's name

Enter the name as it appears in WhatsApp.

Enter contact's name: Rahul

2. Amount

Enter how much they owe.

Enter the amount: 1500

The bot displays it as:

₹1500.00

The current code requires the amount to be greater than ₹100.

3. UPI ID

Optional.

yourname@upi

If you provide one, the bot generates a QR containing the UPI payment information and amount.

4. Reminder frequency

Pick one:

1. Every 30 minutes
2. Every 1 hour
3. Every 2 hours
4. Every 4 hours
5. Every 6 hours
6. Custom

For custom mode, enter the number of minutes.

📲 The UPI QR trick

If you provide a UPI ID, the bot generates a QR code using a UPI payment URI.

The generated QR is saved inside:

qr_codes/

Example:

qr_codes/
└── upi_qr_a1b2c3d4.png

If your friend replies with something like:

send qr
qr bhejo
upi kya hai
how to pay
send upi

the bot can recognize the request and send the QR.

🧾 Payment detection

The bot watches incoming messages for common payment phrases such as:

paid
already paid
sent
transferred
payment done
bhej diya
pay kar diya
transfer kar diya
money bhej diya

If one is detected, the bot:

Prints PAYMENT CONFIRMED

Sends a thank-you message

Stops the reminder loop

⚠️ Important

This is not actual payment verification.

The bot only checks the text of the message.

So if your friend says:

"I paid"

the bot assumes they paid.

It does not check your bank account, UPI transaction history, GPay, PhonePe, Paytm, or any payment gateway.

So, technically:

Friend says "paid"  →  Bot believes them
Actual bank payment →  NOT VERIFIED

😂 Reminder messages

The bot randomly chooses from several reminder styles, ranging from:

Hey! Just a gentle reminder about the ₹1500.00 you owe me. 😊

to the more emotionally devastating:

BHAIIIIII KOBE DIBIIIII AMAR ₹1500.00???

There are also Bengali/Hinglish-style messages and increasingly aggressive messages after repeated reminders.

Because this project is for friends, the messages are intentionally informal and silly.

🛑 How to stop it

Press:

Ctrl + C

The bot catches the keyboard interrupt and exits the reminder loop.

You can also cancel before starting:

Start sending reminders? (y/n):

Enter:

n

📁 Project structure

paisa-dede-bhai/
│
├── debt_reminder.py
├── README.md
├── paisa-dede-bhai-logo.png
│
└── qr_codes/
    └── upi_qr_*.png

🧩 Main functions

generate_upi_qr()

Creates the UPI QR code and saves it locally.

find_chat_smart()

Attempts several methods to locate your friend's WhatsApp chat.

send_message()

Types and sends a WhatsApp message.

send_qr_code()

Uploads and sends the generated QR image.

get_last_message()

Gets the latest detected incoming message.

check_for_qr_request()

Checks whether your friend appears to be asking for payment details.

check_payment_confirmation()

Checks whether the latest message appears to confirm payment.

get_reminder_message()

Selects a random reminder template.

run_reminder_bot()

Runs the entire reminder workflow.

⚠️ A few things to know

This is a fun personal automation project, not a production-grade messaging platform.

Because it uses Selenium to control WhatsApp Web, things can break if WhatsApp changes its website.

Potential problems include:

WhatsApp changes its HTML/XPath structure.

A chat cannot be found.

WhatsApp Web logs out.

The message box selector changes.

The attachment button changes.

Message detection misses unusual wording.

Payment detection incorrectly interprets a message as confirmation.

If something suddenly stops working after a WhatsApp Web update, the Selenium selectors are one of the first places to check.

🔐 Privacy

Don't share or commit:

Your WhatsApp browser profile

Personal UPI information

Generated QR codes

Private contact information

For GitHub, consider adding:

__pycache__/
*.py[cod]

venv/
.venv/

selenium/
qr_codes/

.vscode/
.idea/

🤝 Made for the homies

This project exists for one very important purpose:

Getting your money back from the friend who has been saying "kal de dunga" since 2024.

Use it responsibly. Don't spam people, and don't use it to harass someone.

The goal is:

Borrowed money
      ↓
Friendly reminder
      ↓
"Bro I'll send it tonight"
      ↓
Payment
      ↓
Peace ✌️

🔮 Future ideas

Some fun upgrades for the project:

📊 Track multiple friends and debts

💾 Store debt history in a database

🧠 Better natural-language payment detection

💳 More payment options

🖥️ Build a simple GUI

📈 Add a debt dashboard

🔔 Add desktop notifications

🗓️ Schedule reminders for specific dates

🧹 Automatically clean old QR codes

🧪 Add automated tests

🧩 Split the project into separate modules

<div align="center">

💸 Paisa Dede Bhai

"Bhai paisa de de." — A software solution to a timeless problem.

Made with Python, Selenium, and desperation.

</div>