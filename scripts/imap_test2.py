import imaplib
import email
from email.header import decode_header
import json
import re
import sys

def fetch_emails():
    try:
        print(json.dumps({"status": "connecting"}), flush=True)
        mail = imaplib.IMAP4_SSL('imap.gmail.com', 993)
        
        print(json.dumps({"status": "logging in"}), flush=True)
        mail.login('demo.signal.test@gmail.com', 'autk iuag zfei npvv')
        
        print(json.dumps({"status": "selecting inbox"}), flush=True)
        mail.select('inbox', readonly=True)
        
        print(json.dumps({"status": "searching"}), flush=True)
        status, response = mail.search(None, '(UNSEEN UNANSWERED)')
        if status != 'OK':
            print(json.dumps({"error": "Failed to search inbox"}))
            return
            
        email_ids = response[0].split()
        print(json.dumps({"status": "found", "count": len(email_ids)}), flush=True)
        
        results = []
        
        for email_id in email_ids:
            status, msg_data = mail.fetch(email_id, '(BODY.PEEK[HEADER.FIELDS (SUBJECT FROM DATE)] FLAGS)')
            if status != 'OK':
                continue
                
            flags_str = ""
            headers_bytes = b""
            
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    headers_bytes = response_part[1]
                    match = re.search(br'FLAGS \((.*?)\)', response_part[0])
                    if match:
                        flags_str = match.group(1).decode('utf-8', errors='ignore')
                elif isinstance(response_part, bytes):
                    match = re.search(br'FLAGS \((.*?)\)', response_part)
                    if match:
                        flags_str = match.group(1).decode('utf-8', errors='ignore')
                        
            msg = email.message_from_bytes(headers_bytes)
            
            subject = ""
            if msg['Subject']:
                decoded_parts = decode_header(msg['Subject'])
                for part, encoding in decoded_parts:
                    if isinstance(part, bytes):
                        subject += part.decode(encoding if encoding else 'utf-8', errors='ignore')
                    else:
                        subject += part
            
            sender = msg.get('From', '')
            date = msg.get('Date', '')
            
            flags_list = flags_str.split() if flags_str else []
            
            results.append({
                'Subject': subject.strip(),
                'Sender': sender.strip(),
                'Date': date.strip(),
                'Flags': flags_list
            })
            
        print(json.dumps({"status": "success", "data": results}, indent=2), flush=True)
        mail.logout()
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    fetch_emails()
