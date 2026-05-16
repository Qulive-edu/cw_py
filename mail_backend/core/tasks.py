# mail_backend/core/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import MailAccount, EmailMessage
# 🔑 ДОБАВЛЕНО: sync_all_folders в импорт
from .services import fetch_emails, sync_all_folders

@shared_task(bind=True, max_retries=3)
def sync_account_task(self, account_id, folder=None):
    """
    Синхронизация почты
    folder: если указано — синхронизирует только эту папку,
            если None — синхронизирует все основные папки
    """
    try:
        account = MailAccount.objects.get(id=account_id, is_active=True)
    except MailAccount.DoesNotExist:
        return "Account not found"

    try:
        if folder:
            messages = fetch_emails(account, folder=folder, limit=100)
        else:
            # 🔑 Теперь функция доступна благодаря импорту выше
            messages = sync_all_folders(account, limit_per_folder=50)
        
        created = 0
        updated = 0
        
        for msg_data in messages:
            obj, created_flag = EmailMessage.objects.update_or_create(
                account=account,
                uid=msg_data["uid"],
                defaults={
                    "message_id": msg_data["message_id"],
                    "subject": msg_data["subject"],
                    "sender": msg_data["sender"],
                    "recipients": msg_data["recipients"],
                    "date": msg_data["date"],
                    "body_text": msg_data["body_text"],
                    "body_html": msg_data["body_html"],
                    "folder": msg_data["folder"],
                    "attachments": msg_data["attachments"],
                }
            )
            if created_flag:
                created += 1
            else:
                updated += 1
        
        account.last_sync = timezone.now()
        account.save(update_fields=["last_sync"])
        
        return f"Synced {created} new, {updated} updated for {account.email}"
    
    except Exception as exc:
        self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def send_email_task(account_id, to, subject, body, html=None, attachments=None, save_to_sent=True):
    """Отправка письма с опцией сохранения в папку Sent"""
    from .services import send_email_via_smtp
    account = MailAccount.objects.get(id=account_id)
    
    try:
        send_email_via_smtp(account, to, subject, body, html, attachments)
        
        if save_to_sent:
            EmailMessage.objects.create(
                account=account,
                uid=f"sent-{timezone.now().timestamp()}",
                message_id=f"<local-{timezone.now().isoformat()}>",
                subject=subject,
                sender=account.email,
                recipients=to,
                date=timezone.now(),
                body_text=body,
                body_html=html or "",
                folder="Sent",
                is_read=True,
            )
        
        return "Email sent successfully"
    except Exception as e:
        return f"Failed to send: {str(e)}"