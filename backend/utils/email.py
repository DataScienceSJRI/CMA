"""
Email Utility
=============
Sends HTML emails via SMTP. Supports both STARTTLS (port 587) and SSL (port 465).

For Resend:
    SMTP_HOST=smtp.resend.com
    SMTP_PORT=465
    SMTP_USERNAME=resend
    SMTP_PASSWORD=re_xxxxxxxxxxxx   (your Resend API key)
    SMTP_FROM=invoices@yourdomain.com

For Gmail (App Password):
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USERNAME=you@gmail.com
    SMTP_PASSWORD=xxxx xxxx xxxx xxxx
    SMTP_FROM=you@gmail.com
"""

import smtplib
import ssl
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication


def _sanitize_header(value: str) -> str:
    """Strip CR/LF from email header values to prevent header injection."""
    return value.replace("\r", "").replace("\n", "").strip()


def _make_smtp_connection(host: str, port: int, username: str, password: str):
    context = ssl.create_default_context()
    if port == 465:
        server = smtplib.SMTP_SSL(host, port, timeout=10, context=context)
    else:
        server = smtplib.SMTP(host, port, timeout=10)
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
    server.login(username, password)
    return server


def send_html_email(recipient: str, subject: str, html_body: str) -> None:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    from_addr = os.getenv("SMTP_FROM", username)

    if not username or not password:
        raise ValueError("SMTP credentials not configured.")

    safe_subject = _sanitize_header(subject)
    safe_recipient = _sanitize_header(recipient)
    safe_from = _sanitize_header(from_addr)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = safe_subject
    msg["From"] = safe_from
    msg["To"] = safe_recipient
    msg.attach(MIMEText(html_body, "html"))

    with _make_smtp_connection(host, port, username, password) as server:
        server.sendmail(safe_from, safe_recipient, msg.as_string())


def send_email_with_pdf(
    recipient: str,
    subject: str,
    body_text: str,
    pdf_bytes: bytes,
    pdf_filename: str,
) -> None:
    """Send an email with a PDF attachment."""
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    from_addr = os.getenv("SMTP_FROM", username)

    if not username or not password:
        raise ValueError("SMTP credentials not configured.")

    safe_subject = _sanitize_header(subject)
    safe_recipient = _sanitize_header(recipient)
    safe_from = _sanitize_header(from_addr)

    msg = MIMEMultipart("mixed")
    msg["Subject"] = safe_subject
    msg["From"] = safe_from
    msg["To"] = safe_recipient

    msg.attach(MIMEText(body_text, "plain"))

    pdf_part = MIMEApplication(pdf_bytes, _subtype="pdf")
    pdf_part.add_header("Content-Disposition", "attachment", filename=pdf_filename)
    msg.attach(pdf_part)

    with _make_smtp_connection(host, port, username, password) as server:
        server.sendmail(safe_from, safe_recipient, msg.as_string())
