import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const ROLE_OPTIONS_HOD = [
  { value: "HOD", label: "HOD" },
  { value: "Faculty", label: "Faculty" },
  { value: "Member", label: "Member" },
];

const ROLE_OPTIONS_FACULTY = [
  { value: "Member", label: "Member" },
];

export default function CreateUser() {
  const { user } = useAuth();
  const isHOD = user?.role === "HOD";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const roleOptions = isHOD ? ROLE_OPTIONS_HOD : ROLE_OPTIONS_FACULTY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!role) {
      setError("Please select a role.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        username: email.trim().toLowerCase(),
        role,
        department: user?.department,
      });
      setSuccess(`Invite sent to ${email}. They will receive an email to set their password.`);
      setEmail("");
      setRole("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; detail?: string } } })
          ?.response?.data?.message ||
        (err as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail ||
        "Failed to send invite. The email may already be registered.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Invite User" />

      <div className="max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Invite a new staff member
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              They will receive an email with a link to set their password and
              activate their account. Their department will be set to{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {user?.department}
              </span>
              .
            </p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">
                Institutional Email <span className="text-error-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. staff@sjri.res.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Role <span className="text-error-500">*</span>
              </Label>
              <Select
                options={roleOptions}
                placeholder="Select role"
                defaultValue={role}
                onChange={(v) => setRole(v)}
              />
            </div>

            <Button size="sm" className="w-full" disabled={loading}>
              {loading ? "Sending invite…" : "Send Invite"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
