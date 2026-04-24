import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { EyeIcon, EyeCloseIcon } from "../../icons";

type PageState = "loading" | "ready" | "success" | "error";

export default function SetPassword() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Supabase automatically exchanges the invite token from the URL hash.
  // We listen for the SIGNED_IN event which fires once the session is ready.
  useEffect(() => {
    let settled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        settled = true;
        setPageState("ready");
      }
    });

    // Give Supabase time to process the hash token before declaring it invalid.
    // getSession() can return null while the token exchange is still in flight.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settled = true;
        setPageState("ready");
      } else {
        setTimeout(() => {
          if (!settled) setPageState("error");
        }, 2000);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError("Failed to set password. The link may have expired — contact your administrator.");
      return;
    }

    await supabase.auth.signOut();
    setPageState("success");
    setTimeout(() => navigate("/signin"), 2500);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Verifying your invite link…
        </p>
      </div>
    );
  }

  // ── Invalid / expired link ───────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Invalid or expired link
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This invite link has expired or already been used. Contact your
            administrator to resend an invite.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/10">
              <svg className="h-7 w-7 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Password set!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  // ── Set password form ────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Set your password
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a password to activate your CMA account.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          {error && (
            <div className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="password">
                New Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword
                    ? <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    : <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm">
                Confirm Password <span className="text-error-500">*</span>
              </Label>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <Button size="sm" className="w-full" disabled={submitting}>
              {submitting ? "Setting password…" : "Activate account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
