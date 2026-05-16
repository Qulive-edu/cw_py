import imaplib
import smtplib
import email
from email.header import decode_header
from email.utils import parseaddr
from django.utils import timezone

def decode_mime_words(s):
    return "".join(
        word.decode(encoding or "utf-8") if isinstance(word, bytes) else word
        for word, encoding in decode_header(s) if word
    )

def get_email_body(msg):
    text, html = "", ""
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            cd = str(part.get("Content-Disposition"))
            if "attachment" in cd: continue # noqa: E701
            if ct == "text/plain": text = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace") # noqa: E701
            elif ct == "text/html": html = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace") # noqa: E701
    else:
        ct = msg.get_content_type()
        raw = msg.get_payload(decode=True)
        if raw:
            charset = msg.get_content_charset() or "utf-8"
            if ct == "text/plain": text = raw.decode(charset, errors="replace") # noqa: E701
            elif ct == "text/html": html = raw.decode(charset, errors="replace")  # noqa: E701
    return text, html

def fetch_emails(account, folder='INBOX', limit=50):
    """
    Получает письма из указанной папки
    folder: 'INBOX', 'Sent', 'Drafts', 'Trash', etc.
    """
    mail = imaplib.IMAP4_SSL(account.imap_host, account.imap_port)
    mail.login(account.email, account.password)
    
    # Выбираем папку (с обработкой ошибок)
    try:
        status, _ = mail.select(folder)
        if status != "OK":
            # Если папка не найдена, пробуем альтернативные названия
            folder_map = {
                'Sent': ['Sent', 'Sent Items', 'Отправленные'],
                'Drafts': ['Drafts', 'Черновики'],
                'Trash': ['Trash', 'Deleted Items', 'Корзина'],
                'Spam': ['Spam', 'Junk', 'Спам'],
            }
            for alt_name in folder_map.get(folder, [folder]):
                status, _ = mail.select(alt_name)
                if status == "OK":
                    folder = alt_name
                    break
            if status != "OK":
                mail.logout()
                return []  # Папка не найдена
    except Exception:
        mail.logout()
        return []
    
    status, data = mail.search(None, "ALL")
    if status != "OK":
        mail.logout()
        return []

    mail_ids = data[0].split()
    to_fetch = mail_ids[-limit:] if len(mail_ids) > limit else mail_ids
    messages = []

    for mid in to_fetch:
        try:
            status, msg_data = mail.fetch(mid, "(RFC822)")
            if status != "OK":
                continue
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            subj = decode_mime_words(msg.get("Subject", "") or "")
            sender, _ = parseaddr(msg.get("From", "") or "")
            date_str = msg.get("Date", "")
            
            try:
                date = email.utils.parsedate_to_datetime(date_str)
            except Exception:
                date = timezone.now()
            
            recips = [parseaddr(addr)[1] for addr in (msg.get("To", "") or "").split(",") if addr]
            text, html = get_email_body(msg)

            # Обработка вложений
            attachments = []
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_maintype() == "multipart":
                        continue
                    if "attachment" in str(part.get("Content-Disposition", "")):
                        filename = part.get_filename() or "unknown"
                        attachments.append({
                            "name": decode_mime_words(filename),
                            "size": len(part.get_payload(decode=True) or b""),
                            "content_type": part.get_content_type()
                        })

            messages.append({
                "uid": mid.decode(),
                "message_id": msg.get("Message-ID", ""),
                "subject": subj,
                "sender": sender,
                "recipients": recips,
                "date": date,
                "body_text": text,
                "body_html": html,
                "folder": folder,  # ← Сохраняем имя папки
                "attachments": attachments
            })
        except Exception:
            continue  # Пропускаем проблемные письма
    
    mail.logout()
    return messages


def send_email_via_smtp(account, to, subject, body, html=None, attachments_paths=None):
    msg = email.message.EmailMessage()
    msg["From"] = account.email
    msg["To"] = ", ".join(to)
    msg["Subject"] = subject
    msg.set_content(body, "plain", "utf-8")
    if html:
        msg.add_alternative(html, "html", "utf-8")
    if attachments_paths:
        for path in attachments_paths:
            with open(path, "rb") as f:
                msg.add_attachment(f.read(), maintype="application", subtype="octet-stream", filename=path.split("/")[-1])

    if account.smtp_port == 465:
        with smtplib.SMTP_SSL(account.smtp_host, account.smtp_port) as server:
            server.login(account.email, account.password)
            server.send_message(msg)
    else:
        with smtplib.SMTP(account.smtp_host, account.smtp_port) as server:
            server.starttls()
            server.login(account.email, account.password)
            server.send_message(msg)
            
def sync_all_folders(account, limit_per_folder=50):
    """Синхронизирует все основные папки аккаунта"""
    folders = ['INBOX', 'Sent', 'Drafts', 'Trash']
    all_messages = []
    
    for folder in folders:
        try:
            messages = fetch_emails(account, folder=folder, limit=limit_per_folder)
            all_messages.extend(messages)
        except Exception:
            continue  # Если папка не доступна — пропускаем
    
    return all_messages