import { useState } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function SignInForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authAPI.login(email, password);
      login(data.access_token, data.user, data.refresh_token);
      navigate("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");

    const redirectTo = `${window.location.origin}/set-password`;
    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
      forgotEmail,
      { redirectTo }
    );

    setForgotLoading(false);

    if (supabaseError) {
      setForgotError("Could not send reset email. Please try again.");
    } else {
      setForgotMessage(
        "Reset link sent. Check your inbox and click the link to set a new password."
      );
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Institution header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
          <svg className="h-7 w-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white/90 sm:text-2xl">
          SJRI Consultations
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Department of Biostatistics 
        </p>
      </div>

      {/* Sign-in card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        {!showForgot ? (
          <>
            <div className="mb-6">
              <h2 className="mb-1 font-semibold text-gray-800 text-title-sm dark:text-white/90">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your credentials to access the dashboard
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Username <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="Enter your username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>
                      Password <span className="text-error-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs text-brand-500 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="mb-1 font-semibold text-gray-800 text-title-sm dark:text-white/90">
                Reset your password
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {forgotMessage ? (
              <div className="rounded-lg border border-success-300 bg-success-50 p-3 text-sm text-success-600 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                {forgotMessage}
              </div>
            ) : (
              <>
                {forgotError && (
                  <div className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                    {forgotError}
                  </div>
                )}
                <form onSubmit={handleForgotPassword}>
                  <div className="space-y-6">
                    <div>
                      <Label>Email address</Label>
                      <Input
                        type="email"
                        placeholder="you@sjri.res.in"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" size="sm" disabled={forgotLoading}>
                      {forgotLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setShowForgot(false);
                setForgotEmail("");
                setForgotMessage("");
                setForgotError("");
              }}
              className="mt-4 text-sm text-gray-500 hover:underline"
            >
              ← Back to sign in
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
        &copy; {new Date().getFullYear()} Department of Biostatistics &amp; Data Science. All rights reserved.
      </p>
    </div>
  );
}
