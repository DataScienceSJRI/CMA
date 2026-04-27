"""
One-time script: create all staff users + wire up members_managed relationships.

Usage (from backend/ directory with venv active):
    python setup_users.py
    python setup_users.py --dry-run     # show what would happen, no changes
    python setup_users.py --password "Custom@2026"

What it does:
  1. Creates each user in Supabase Auth (password set, email confirmed).
     Skips users that already exist in the users table.
  2. Inserts a row in the `users` table for each new auth user.
  3. Inserts manager → member rows in `members_managed` (skips duplicates).
"""

import argparse
import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DEFAULT_PASSWORD = "SJRI@2026"
DEPARTMENT = "Biostatistics"

# ── Staff to create ───────────────────────────────────────────────────────────
# (email, role)  — skip any already in the users table
STAFF = [
    ("tinku.sarah@sjri.res.in",      "HOD"),
    ("aswathi.s@sjri.res.in",        "Member"),
    ("kripa.maria@sjri.res.in",      "Member"),
    ("fathima.a@sjri.res.in",        "Member"),
    ("smitha.j@sjri.res.in",         "Member"),
    ("santu.g@stjohns.in",           "Faculty"),
    ("franciosalgeo.g@sjri.res.in",  "Member"),
    ("rajesh.majumder@sjri.res.in",  "Member"),
    ("sumithrars@sjri.res.in",       "Faculty"),
    ("michael.john@stjohns.in",      "Faculty"),
]

# ── Managed-member relationships ──────────────────────────────────────────────
# (manager_email, [member_email, ...])
MANAGED = [
    ("tinku.sarah@sjri.res.in", [
        "aswathi.s@sjri.res.in",
        "kripa.maria@sjri.res.in",
        "fathima.a@sjri.res.in",
        "smitha.j@sjri.res.in",
    ]),
    ("santu.g@stjohns.in", [
        "franciosalgeo.g@sjri.res.in",
        "rajesh.majumder@sjri.res.in",
    ]),
    # sumithrars and michael.john — members TBD, add here when known
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        sys.exit("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # ── Step 1: fetch existing users so we can skip them ─────────────────────
    existing_resp = client.table("users").select("user_id, username").execute()
    existing = {row["username"]: row["user_id"] for row in existing_resp.data}
    print(f"Existing users in DB: {len(existing)}")

    # ── Step 2: create missing users ─────────────────────────────────────────
    email_to_uid: dict[str, str] = dict(existing)  # email → user_id (grows as we add)

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Creating users with password: {args.password!r}\n")

    created = skipped = failed = 0
    for email, role in STAFF:
        if email in existing:
            print(f"  SKIP  {email:<45}  (already in users table)")
            skipped += 1
            continue

        if args.dry_run:
            print(f"  WOULD CREATE  {email:<45}  role={role}")
            created += 1
            continue

        try:
            # create_user sets password + confirms email in one call
            resp = client.auth.admin.create_user({
                "email": email,
                "password": args.password,
                "email_confirm": True,
            })
            uid = resp.user.id

            client.table("users").insert({
                "user_id": uid,
                "username": email,
                "role": role,
                "department": DEPARTMENT,
                "is_active": True,
            }).execute()

            email_to_uid[email] = uid
            print(f"  OK    {email:<45}  role={role}  uid={uid}")
            created += 1

        except Exception as e:
            print(f"  FAIL  {email:<45}  — {e}")
            failed += 1

    print(f"\nUsers: {created} created, {skipped} skipped, {failed} failed.")

    # ── Step 3: members_managed ───────────────────────────────────────────────
    # Fetch existing relationships to avoid duplicate inserts
    existing_mm = set()
    if not args.dry_run:
        mm_resp = client.table("members_managed").select("manager_id, managed_member_user_id").execute()
        existing_mm = {(r["manager_id"], r["managed_member_user_id"]) for r in mm_resp.data}

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Setting up members_managed relationships:\n")

    mm_added = mm_skipped = mm_failed = 0
    for manager_email, member_emails in MANAGED:
        manager_uid = email_to_uid.get(manager_email)
        if not manager_uid:
            print(f"  WARN  Manager {manager_email} not found — skipping their team")
            continue

        for member_email in member_emails:
            member_uid = email_to_uid.get(member_email)
            if not member_uid:
                print(f"  WARN  Member {member_email} not found — skipping")
                continue

            if args.dry_run:
                print(f"  WOULD LINK  {manager_email}  →  {member_email}")
                mm_added += 1
                continue

            if (manager_uid, member_uid) in existing_mm:
                print(f"  SKIP  {manager_email}  →  {member_email}  (already linked)")
                mm_skipped += 1
                continue

            try:
                client.table("members_managed").insert({
                    "manager_id": manager_uid,
                    "managed_member_user_id": member_uid,
                }).execute()
                print(f"  OK    {manager_email}  →  {member_email}")
                mm_added += 1
            except Exception as e:
                print(f"  FAIL  {manager_email}  →  {member_email}  — {e}")
                mm_failed += 1

    print(f"\nmembers_managed: {mm_added} added, {mm_skipped} skipped, {mm_failed} failed.")
    print("\nDone. All users can log in with:", args.password)


if __name__ == "__main__":
    main()
