import os
import json
import random
import urllib.request
import urllib.error
from typing import List, Dict

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

def format_inr(amt: float) -> str:
    return f"Rs. {amt:,.2f}"


# High quality native multilingual templates for instant offline generation or Groq fallback
TEMPLATES = {
    "bengali": {
        "casual": [
            "Hey {name}! Kemon achis? Oi {amount} taka ta jodi ektu transfer kore ditis, khub subidha hoto! 😊",
            "Bhai {name}, oi {amount} ta mone achhe toh? Somoy moto ektu pathiye de please! 🙏",
            "Ki re {name}! Taka {amount} ta kobe pabo? Cha khawabi naki taka ta pathabi? ☕",
            "Hello {name}! Gentle reminder regarding the {amount} borrowed. Jodi ekhon deowa sombhob hoy toh bhej de! ✨",
            "Bhai ektu taka-poisa r chaap achhe, oi {amount} ta ektu dekhe ne na please! 🤝",
            "Sun {name}, amar {amount} ta bhej de na re, ekta urgent payment korte hobe! 📱",
            "Hey buddy! Just checking in about {amount}. No rush, but whenever free pathiye dis! 🌟",
            "Bhai {name}, UPI QR share korechhi, {amount} ta scan kore pay kore de joldi! 📲",
            "Ki khobor bondhu? Oi {amount} ta ajker moddhe pathano jabe ki? 💬",
            "Reminding you about {amount} borrowed earlier. Dhonnobad in advance! 🙌"
        ],
        "serious": [
            "Shuno {name}, ami tomake {amount} taka ta ferot deowar kotha mone koriye dichhi. Please eta settle koro. 📌",
            "{name}, tomar kachhe {amount} taka baki achhe. Besh koyekdin holo, please ajke eta clear koro. 💼",
            "Reminder regarding outstanding dues of {amount}. Kindly transfer to my UPI at the earliest. 🙏",
            "{name}, ami expect korchhilam je tumi {amount} ta somoy moto ferot debe. Kono issue thakle bolo. ⚖️",
            "Please acknowledge this reminder for {amount}. It has been pending for quite a while now. ⏱️",
            "Oi {amount} taka ta urgent proyojon. Please ar deri koro na, ekhoni bhej de. 🏦",
            "Final reminder: Your balance of {amount} is pending. Please initiate the UPI transaction. 📋",
            "Account settlement reminder: {amount} payable by {name}. Kindly resolve this today. 💳",
            "{name}, eta business/personal commitment chhilo. Please {amount} transfer kore settlement confirm koro. 🖋️",
            "Still waiting for {amount} to be credited. Please confirm once done. ⌛"
        ],
        "angry": [
            "BHAIIII {name}! Kobe dibi amar {amount}??? Koto din holo bol toh?! 🤬",
            "GirlFriend ke ektu coffee khawabo mamaa, amake amar {amount} ferodh daoo! 😭😭",
            "LEWRAAA 24 ghontar modhe naa dile {amount}, barite giye boshe thakbo kintu! 👊",
            "Arey bhai {name}, amar taka niye nije mojjay achhis ar ami ekhane bheekh maangchhi! De amar {amount}! 😤",
            "Koto baar bolte hobe {amount} ta dite? Shameless hoye geli naki puro?! 😡",
            "Bhai paaye porchi, amar {amount} ta ferot de! R wait korte parbo na! 🚨",
            "Taka neowar somoy toh khub 'bhai bhai', ekhon {amount} ferot dite phone dhoris na?! 📞💥",
            "Taka ta ki gache fole bhabli? Send my {amount} RIGHT NOW! 💸🔥",
            "Enough excuses {name}! Transfer {amount} immediately or I'm calling everyone! 🛑",
            "Kalke dibi kalke dibi kore 2 mash katiye dili! Give my {amount} back today! ⏰💥"
        ]
    },
    "hindi": {
        "casual": [
            "Bhai {name}, kaise ho? Wo {amount} yaad hai na? Free hoke UPI pe bhej dena! 😊",
            "Hey {name}! Just a friendly reminder for the {amount} you borrowed. Thanks bro! 🙏",
            "Bhai {name}, choti si reminder: wo {amount} ka kya scene hai? ☕",
            "Suno {name}, jab time mile tab wo {amount} transfer kar dena, chill scene hai! ✨",
            "Bhai QR code bhej raha hoon, {amount} scan karke bhej dena! 📲",
            "Aur bhai! Any update on the {amount}? Hope sab badhiya chal raha hai! 🌟",
            "Bhai zara {amount} bhej de na, ek jagah payment karni hai online! 📱",
            "Hey {name}! Ping kar raha hoon bas {amount} ke liye. Let me know when done! 🤝",
            "Reminder: {amount} pending hai bhai. Sham tak ho sake toh kar dena! 💬",
            "Thanks in advance {name}! Wo {amount} transfer karke screenshot bhej dena! 🙌"
        ],
        "serious": [
            "{name}, ye reminder hai aapke {amount} ke payment ke liye. Kripya aaj hi settle karein. 📌",
            "{name}, kafi samay ho gaya hai {amount} pending hai. Please aaj clear kar dijiye. 💼",
            "Formal reminder for {amount} owed by you. Kindly transfer to my UPI ID at the earliest. 🙏",
            "{name}, commitments matter. {amount} transfer karke account close karein please. ⚖️",
            "Please confirm when the transfer of {amount} will be processed. Urgent requirement hai. ⏱️",
            "{amount} ka balance abhi tak unpaid hai. Aaj finalize kar dijiye. 📋",
            "{name}, maine baar baar wait kiya hai. Please {amount} settle karein bina kisi aur delay ke. 🏦",
            "Official ping for {amount}. Let me know once transaction is completed. 💳",
            "Awaiting credit of {amount}. Please initiate payment via QR or UPI directly. ⌛",
            "Kindly settle the outstanding amount of {amount} today. Thanks. 🖋️"
        ],
        "angry": [
            "Bhai {name}! Kab dega mera {amount}?! 2024 se 'kal dunga' bol raha hai! 🤬",
            "Paisa lene ke time to bohot jaldi thi, ab mera {amount} wapas karne me aafat aa rahi hai?! 😤",
            "Bhai phone uthana band mat kar! Mera {amount} chup chaap transfer kar abhi! 😡",
            "Roz ka drama band kar {name}! I need my {amount} RIGHT NOW! 🚨",
            "Sharam kar le thodi bhai, mera hi paisa maangne ke liye mujhe gidgidaana pad raha hai! De {amount}! 💸🔥",
            "Agar aaj sham tak {amount} nahi aaya toh direct ghar aa raha hoon tere! 👊",
            "Excuses banana band kar aur {amount} gpay kar turant! 🛑",
            "Bhai majak chal raha hai kya? Itne mahine se {amount} atka ke rakha hai! ⏰💥",
            "Last warning de raha hoon: transfer {amount} right away or things get awkward! 📞💥",
            "Paisa ped pe nahi ugta mera! Send the damn {amount}! 💣"
        ]
    },
    "english": {
        "casual": [
            "Hey {name}! Hope you're having a good week. Quick friendly ping about the {amount}. 😊",
            "Hi {name}! Just following up on the {amount} from earlier. Whenever you get a chance! 🙏",
            "Hey buddy! Remember the {amount}? Ping me once you've sent it over. Thanks! ☕",
            "Hi {name}, sending you the UPI QR for {amount}. Feel free to scan and pay! 📲",
            "Hope all is well! Just checking in regarding the {amount} balance. Let me know! ✨",
            "Hey {name}! Any update on the {amount}? Appreciate you clearing it soon! 🤝",
            "Quick reminder about {amount} borrowed. Thanks a bunch in advance! 🌟",
            "Hi {name}! Settle the {amount} whenever you're at your phone today. Cheers! 📱",
            "Friendly nudge for the {amount}! Let's close this out when you're free. 💬",
            "Hey {name}! Hope work is going great. Drop {amount} when you can! 🙌"
        ],
        "serious": [
            "Dear {name}, this is a formal reminder regarding the outstanding {amount}. Please settle promptly. 📌",
            "Hello {name}, the amount of {amount} has been pending for some time now. Kindly clear it today. 💼",
            "Requesting you to prioritize settling the {amount} balance. Details attached. 🙏",
            "Hi {name}, please honor our agreement and initiate the transfer of {amount}. ⚖️",
            "This payment of {amount} is overdue. Please provide a clear timeline or process today. ⏱️",
            "Outstanding debt notice: {amount} payable by {name}. Kindly resolve at your earliest convenience. 📋",
            "{name}, I need the {amount} cleared immediately for financial commitments on my end. 🏦",
            "Kindly verify receipt of this message and process {amount} to my UPI ID. 💳",
            "Awaiting transaction confirmation for {amount}. Please update me once sent. ⌛",
            "Urgent request: Please settle the balance of {amount} without further delay. 🖋️"
        ],
        "angry": [
            "Seriously {name}? How many times do I have to ask for MY OWN {amount}?! 🤬",
            "Stop ghosting my messages! You borrowed {amount} and it's long overdue! 😤",
            "Enough with the delays! Send my {amount} RIGHT NOW! 😡",
            "You were quick to borrow {amount}, now you can't even respond? Pay up! 🚨",
            "I'm done being polite about this. Transfer the {amount} immediately! 💸🔥",
            "Are you actually planning to return my {amount} or what? This is ridiculous! 👊",
            "I trusted you with {amount} and this is how you repay that trust? Send it today! 🛑",
            "No more excuses {name}. I need my {amount} cleared before end of day! ⏰💥",
            "Don't make me escalate this. Settle the {amount} immediately! 📞💥",
            "Pay back the {amount} you owe me. Right now. 💣"
        ]
    }
}

def generate_ai_messages(name: str, amount: float, tone: str = "casual", language: str = "english") -> List[str]:
    tone_key = tone.lower() if tone.lower() in ["casual", "serious", "angry"] else "casual"
    lang_key = language.lower() if language.lower() in ["bengali", "hindi", "english"] else "english"
    formatted_amount = format_inr(amount)

    # 1. Attempt Groq API if key is set
    if GROQ_API_KEY:
        try:
            prompt = (
                f"Generate 10 unique, culturally appropriate WhatsApp debt reminder messages for:\n"
                f"- Contact: {name}\n"
                f"- Amount: {formatted_amount}\n"
                f"- Tone: {tone_key} (casual friendly / professional serious / very frustrated and angry)\n"
                f"- Language preference: {lang_key}\n"
                f"- Include 3 in English, 3 in Hindi, 3 in Bengali, 1 mixed\n"
                f"- Keep under 200 chars each\n"
                f"- No threatening language, only assertive reminders\n"
                f"Return a JSON object with key 'messages' as an array of 10 strings."
            )
            req_data = json.dumps({
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.8,
                "response_format": {"type": "json_object"}
            }).encode('utf-8')

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=req_data,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                content = result["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                if isinstance(parsed, dict):
                    # Find list in values
                    for val in parsed.values():
                        if isinstance(val, list) and len(val) >= 5:
                            return [str(m) for m in val[:10]]
                elif isinstance(parsed, list):
                    return [str(m) for m in parsed[:10]]
        except Exception as e:
            print(f"Groq API call fallback: {e}")

    # 2. High-quality contextual fallback
    pool = TEMPLATES.get(lang_key, {}).get(tone_key, TEMPLATES["english"]["casual"])
    rendered = [msg.format(name=name, amount=formatted_amount) for msg in pool]
    return rendered[:10]

if __name__ == "__main__":
    msgs = generate_ai_messages("Rahul", 1500, "angry", "bengali")
    print(f"Successfully generated {len(msgs)} messages for testing.")

