"""Utility functions for sending email and SMS notifications.

Requires the following environment variables:
- SENDGRID_API_KEY: API key for SendGrid
- EMAIL_FROM: verified sender email
- EMAIL_TO: comma-separated recipient list (or set per call)
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, SMS_TO

In a real production system you might store recipients per user.
This module offers thin wrappers; errors are logged and swallowed so
that notification failures do not crash the main process.
"""
from __future__ import annotations

import os
import logging
from typing import Sequence, Optional

logger = logging.getLogger(__name__)

try:
    import sendgrid
    from sendgrid.helpers.mail import Mail
except ImportError:  # pragma: no cover
    sendgrid = None  # type: ignore

try:
    from twilio.rest import Client as TwilioClient
except ImportError:  # pragma: no cover
    TwilioClient = None  # type: ignore

def send_email(subject: str, content: str, to: Optional[Sequence[str]] = None) -> None:
    if sendgrid is None:
        logger.warning("sendgrid package not installed; skipping email notification")
        return

    api_key = os.getenv("SENDGRID_API_KEY")
    if not api_key:
        logger.info("SENDGRID_API_KEY not set; skipping email send")
        return

    sender = os.getenv("EMAIL_FROM")
    recipients = to or os.getenv("EMAIL_TO", "").split(",")
    if not sender or not recipients:
        logger.info("Email sender/recipients not configured; skipping email send")
        return

    sg = sendgrid.SendGridAPIClient(api_key)
    message = Mail(from_email=sender, to_emails=recipients, subject=subject, plain_text_content=content)
    try:
        response = sg.send(message)
        logger.info("Email sent – status %s", response.status_code)
    except Exception as e:  # pragma: no cover
        logger.error("Failed to send email: %s", e)


def send_sms(body: str, to: Optional[str] = None) -> None:
    if TwilioClient is None:
        logger.warning("twilio package not installed; skipping SMS notification")
        return

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    sms_from = os.getenv("TWILIO_FROM")
    sms_to = to or os.getenv("SMS_TO")
    if not all([account_sid, auth_token, sms_from, sms_to]):
        logger.info("Twilio credentials not fully configured; skipping SMS send")
        return

    client = TwilioClient(account_sid, auth_token)
    try:
        message = client.messages.create(body=body, from_=sms_from, to=sms_to)
        logger.info("SMS sent – SID %s", message.sid)
    except Exception as e:  # pragma: no cover
        logger.error("Failed to send SMS: %s", e)
