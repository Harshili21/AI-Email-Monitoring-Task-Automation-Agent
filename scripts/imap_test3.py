import imaplib
import email
from email.header import decode_header
import json
import re

def decode_str(s):
    if not s: return ""
    decoded_parts = decode_header(s)
    res = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            res += part.decode(encoding if encoding else 'utf-8', errors='ignore')
        else:
            res += str(part)
    return res.strip()

def get_email_body(msg):
    body_text = ""
    body_html = ""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            if ctype == 'text/plain' and 'attachment' not in cdispo:
                try:
                    body_text += part.get_payload(decode=True).decode('utf-8', errors='ignore')
                except:
                    pass
            elif ctype == 'text/html' and 'attachment' not in cdispo:
                try:
                    body_html += part.get_payload(decode=True).decode('utf-8', errors='ignore')
                except:
                    pass
    else:
        ctype = msg.get_content_type()
        if ctype == 'text/plain':
            try:
                body_text = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
            except:
                pass
        elif ctype == 'text/html':
            try:
                body_html = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
            except:
                pass
    return body_text, body_html

def fetch_emails():
    try:
        print(json.dumps({"status": "connecting"}), flush=True)
        mail = imaplib.IMAP4_SSL('imap.gmail.com', 993)
        
        print(json.dumps({"status": "logging in"}), flush=True)
        mail.login('demo.signal.test@gmail.com', 'autk iuag zfei npvv')
        
        print(json.dumps({"status": "selecting inbox"}), flush=True)
        mail.select('inbox', readonly=True)
        
        print(json.dumps({"status": "searching"}), flush=True)
        status, response = mail.search(None, 'ALL')
        if status != 'OK':
            print(json.dumps({"error": "Failed to search inbox"}))
            return
            
        email_ids = response[0].split()
        total = len(email_ids)
        print(json.dumps({"status": "found", "count": total}), flush=True)
        
        # Fetch all emails as requested
        fetch_ids = email_ids
        
        results = []
        if fetch_ids:
            batch_str = b",".join(fetch_ids).decode('ascii')
            # Fetch FULL email for these 50
            status, msg_data = mail.fetch(batch_str, '(RFC822 FLAGS)')
            if status == 'OK':
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        current_flags = ""
                        match = re.search(br'FLAGS \((.*?)\)', response_part[0])
                        if match:
                            current_flags = match.group(1).decode('utf-8', errors='ignore')
                        
                        msg = email.message_from_bytes(response_part[1])
                        subject = decode_str(msg.get('Subject', ''))
                        sender = decode_str(msg.get('From', ''))
                        recipient = decode_str(msg.get('To', ''))
                        date = decode_str(msg.get('Date', ''))
                        flags_list = current_flags.split() if current_flags else []
                        
                        body_text, body_html = get_email_body(msg)
                        
                        results.append({
                            'Subject': subject,
                            'Sender': sender,
                            'Recipient': recipient,
                            'Date': date,
                            'Flags': flags_list,
                            'Body_Text': body_text.strip(),
                            'Body_Html': body_html.strip()
                        })
                
        print(json.dumps({"status": "progress", "fetched": len(results)}), flush=True)
            
        with open('emails_result.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
            
        print(json.dumps({"status": "success", "total_saved": len(results), "file": "emails_result.json"}), flush=True)
        mail.logout()
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    fetch_emails()
