"""
Quick SMTP test — run from the backend/ directory:

    python scripts/test_email.py recipient@example.com

Reads SMTP settings from .env and sends a plain test email.
Prints a clear pass/fail with the exact error if it fails.
"""

import os
import sys

# Load .env from backend/
from pathlib import Path
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_email.py <recipient-email>")
        sys.exit(1)

    recipient = sys.argv[1]

    host     = os.getenv("SMTP_HOST", "")
    port     = int(os.getenv("SMTP_PORT", "465"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    from_addr = os.getenv("SMTP_FROM", "")

    print("\nSMTP config loaded from .env:")
    print(f"  Host     : {host}")
    print(f"  Port     : {port}")
    print(f"  Username : {username}")
    print(f"  Password : {'*' * 6}{password[-4:] if password else ''}")
    print(f"  From     : {from_addr}")
    print(f"  To       : {recipient}\n")

    # Basic config checks before attempting connection
    if not password or password in ("your_resend_api_key_here", "xxxx xxxx xxxx xxxx"):
        print("❌  SMTP_PASSWORD is not set. Update it in backend/.env")
        sys.exit(1)

    if "yourdomain.com" in from_addr or not from_addr:
        print("❌  SMTP_FROM is still a placeholder. Set it to a verified sender address.")
        print("    - Resend: verify a domain at resend.com/domains, then use user@yourdomain.com")
        print("    - Or use Resend's test address: onboarding@resend.dev  (sends only to your account email)")
        sys.exit(1)

    # Import here so missing dotenv doesn't crash before the checks above
    import smtplib, ssl
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "CMA — SMTP test email"
    msg["From"]    = from_addr
    msg["To"]      = recipient
    msg.attach(MIMEText(
        "<h2>SMTP is working ✓</h2>"
        "<p>This test email was sent from the CMA backend.</p>"
        f"<p><small>Host: {host}:{port} | From: {from_addr}</small></p>",
        "html"
    ))

    ctx = ssl.create_default_context()
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=10, context=ctx) as server:
                server.login(username, password)
                server.sendmail(from_addr, recipient, msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                server.starttls(context=ctx)
                server.ehlo()
                server.login(username, password)
                server.sendmail(from_addr, recipient, msg.as_string())

        print(f"✅  Email sent successfully to {recipient}")
        print("    Check your inbox (and spam folder).")

    except smtplib.SMTPAuthenticationError:
        print("❌  Authentication failed — API key or password is wrong.")
        print("    Resend: make sure SMTP_PASSWORD is your API key (starts with re_)")
    except smtplib.SMTPSenderRefused as e:
        print(f"❌  Sender address rejected: {e}")
        print(f"    SMTP_FROM '{from_addr}' is not a verified sender in Resend.")
        print("    Go to resend.com/domains and verify your domain first.")
    except smtplib.SMTPRecipientsRefused as e:
        print(f"❌  Recipient rejected: {e}")
    except smtplib.SMTPException as e:
        print(f"❌  SMTP error: {e}")
    except OSError as e:
        print(f"❌  Connection error: {e}")
        print(f"    Check that {host}:{port} is reachable (firewall / VPN?)")


if __name__ == "__main__":
    main()
