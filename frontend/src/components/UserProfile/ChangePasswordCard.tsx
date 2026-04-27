import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { EyeIcon, EyeCloseIcon } from "../../icons";

export default function ChangePasswordCard() {
  const { user } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!current) { setError("Please enter your current password."); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("Passwords do not match."); return; }
    if (next === current) { setError("New password must be different from the current one."); return; }

    setLoading(true);

    // Verify current password first by re-authenticating
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.username ?? "",
      password: current,
    });

    if (signInErr) {
      setLoading(false);
      setError("Current password is incorrect.");
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next });
    setLoading(false);

    if (updateErr) {
      setError("Failed to update password. Please try again.");
      return;
    }

    setSuccess("Password updated successfully.");
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const toggle = <span
    onClick={() => setShowPasswords((v) => !v)}
    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer"
  >
    {showPasswords
      ? <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
      : <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />}
  </span>;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        Change Password
      </h4>

      {success && (
        <div className="mb-4 rounded-lg border border-success-300 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
        <div>
          <Label htmlFor="current-password">Current Password</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showPasswords ? "text" : "password"}
              placeholder="Your current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            {toggle}
          </div>
        </div>

        <div>
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPasswords ? "text" : "password"}
              placeholder="At least 8 characters"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showPasswords ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        <Button size="sm" disabled={loading}>
          {loading ? "Updating…" : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
