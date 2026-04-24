"""
Bulk Invite Script
==================
Reads a CSV of staff and sends Supabase invite emails to each one,
then inserts the user profile into the users table.

CSV format (with header row):
    email,role,department

Allowed roles: HOD, Faculty, Member

Usage:
    # Dry run (no emails sent, no DB writes)
    python scripts/bulk_invite.py staff.csv --dry-run

    # Live run
    python scripts/bulk_invite.py staff.csv

Run from the backend/ directory so that .env is picked up automatically.
"""

import argparse
import csv
import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()

from supabase import create_client  # noqa: E402

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
REDIRECT_TO = f"{FRONTEND_URL}/set-password"

ALLOWED_ROLES = {"HOD", "Faculty", "Member"}


def main():
    parser = argparse.ArgumentParser(description="Bulk invite staff to CMA")
    parser.add_argument("csv_file", help="Path to CSV file (email,role,department)")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate CSV and print what would happen without sending invites",
    )
    args = parser.parse_args()

    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    # ── Read and validate CSV ─────────────────────────────────────────────────
    rows = []
    with open(args.csv_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):  # start=2 because row 1 is header
            email = row.get("email", "").strip().lower()
            role = row.get("role", "").strip()
            department = row.get("department", "").strip()

            errors = []
            if not email or "@" not in email:
                errors.append(f"invalid email '{email}'")
            if role not in ALLOWED_ROLES:
                errors.append(f"invalid role '{role}' (must be one of {ALLOWED_ROLES})")
            if not department:
                errors.append("department is required")

            if errors:
                print(f"  Row {i}: SKIPPED — {'; '.join(errors)}")
                continue

            rows.append({"email": email, "role": role, "department": department})

    if not rows:
        print("No valid rows found. Exiting.")
        sys.exit(1)

    print(f"\n{'DRY RUN — ' if args.dry_run else ''}Found {len(rows)} valid staff to invite:\n")
    for r in rows:
        print(f"  {r['email']:40s}  {r['role']:10s}  {r['department']}")

    if args.dry_run:
        print("\nDry run complete. No emails sent, no DB changes made.")
        return

    print(f"\nSending invites (redirect → {REDIRECT_TO})...\n")

    success = 0
    failed = 0

    for r in rows:
        email, role, department = r["email"], r["role"], r["department"]
        try:
            # Send invite email via Supabase
            response = supabase.auth.admin.invite_user_by_email(
                email,
                options={"redirect_to": REDIRECT_TO},
            )

            if not response.user:
                raise ValueError("No user returned from invite call")

            # Insert profile into users table
            supabase.table("users").insert({
                "user_id": response.user.id,
                "username": email,
                "role": role,
                "department": department,
                "is_active": True,
            }).execute()

            print(f"  ✓ {email}")
            success += 1

        except Exception as e:
            print(f"  ✗ {email} — {e}")
            failed += 1

        # Small delay to avoid hitting Supabase rate limits
        time.sleep(0.3)

    print(f"\nDone. {success} invited, {failed} failed.")
    if failed:
        print("Re-run the script with only the failed rows to retry.")


if __name__ == "__main__":
    main()
