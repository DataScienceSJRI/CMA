"""
Run this script once on the server to set a default password for every user
in the users table.  Users can log in immediately and change their password
from the app later.

Usage (from backend/ directory):
    python set_passwords.py
    python set_passwords.py --password "Custom@2026"
    python set_passwords.py --dry-run        # show what would happen, no changes
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Password to set for all users")
    parser.add_argument("--dry-run", action="store_true", help="Print users without making changes")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        sys.exit("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # Fetch all users from our users table (user_id = Supabase Auth UUID)
    response = client.table("users").select("user_id, username, role").execute()
    users = response.data

    if not users:
        print("No users found.")
        return

    print(f"Found {len(users)} user(s).")
    if args.dry_run:
        print("\n[DRY RUN] Would set password for:")
    else:
        print(f"\nSetting password to: {args.password!r}\n")

    ok = 0
    fail = 0
    for u in users:
        uid = u["user_id"]
        email = u["username"]
        role = u["role"]

        if args.dry_run:
            print(f"  {email:<45}  ({role})")
            continue

        try:
            client.auth.admin.update_user_by_id(uid, {"password": args.password})
            print(f"  OK   {email:<45}  ({role})")
            ok += 1
        except Exception as e:
            print(f"  FAIL {email:<45}  ({role})  — {e}")
            fail += 1

    if not args.dry_run:
        print(f"\nDone: {ok} updated, {fail} failed.")
        if ok:
            print(f"Users can now log in with password: {args.password!r}")


if __name__ == "__main__":
    main()
