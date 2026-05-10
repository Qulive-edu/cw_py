from celery import shared_task
from django.utils import timezone
from .models import MailAccount, EmailMessage
from .services import fetch_emails

@shared_task(bind=True, max_retries=3)
def sync_account_task(self, account_id):
    try:
        account = MailAccount.objects.get(id=account_id, is_active=True)
    except MailAccount.DoesNotExist:
        return

    try:
        messages = fetch_emails(account, limit=100)
        created = 0
        for msg_data in messages:
            _, c = EmailMessage.objects.get_or_create(
                account=account,
                uid=msg_data["uid"],
                defaults=msg_data
            )
            if c: created += 1  # noqa: E701
        account.last_sync = timezone.now()
        account.save(update_fields=["last_sync"])
        return f"Synced {created} new messages for {account.email}"
    except Exception as exc:
        self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@shared_task
def send_email_task(account_id, to, subject, body, html=None, attachments=None):
    account = MailAccount.objects.get(id=account_id)
    from .services import send_email_via_smtp
    send_email_via_smtp(account, to, subject, body, html, attachments)