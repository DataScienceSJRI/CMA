import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import LoadingSpinner from "../../components/cma/LoadingSpinner";
import { consultationAPI } from "../../services/api";
import type { ConsultationFormData, ConflictNotification } from "../../types";

const professionOptions = [
  { value: "PhD Student", label: "PhD Student" },
  { value: "Medical Doctor", label: "Medical Doctor" },
  { value: "Nursing Staff", label: "Nursing Staff" },
  { value: "Researcher", label: "Researcher" },
  { value: "Faculty", label: "Faculty" },
  { value: "Other", label: "Other" },
];

const reasonOptions = [
  { value: "Thesis Analysis", label: "Thesis Analysis" },
  { value: "Sample Size Calculation", label: "Sample Size Calculation" },
  { value: "Data Management", label: "Data Management" },
  { value: "Statistical Review", label: "Statistical Review" },
  { value: "Research Design", label: "Research Design" },
  { value: "Other", label: "Other" },
];

const paymentStatusOptions = [
  { value: "Not Required", label: "Not Required" },
  { value: "Paid", label: "Paid" },
  { value: "Not Paid", label: "Not Paid" },
];

const statusOptions = [
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function EditConsultation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ConsultationFormData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [conflict, setConflict] = useState<ConflictNotification | null>(null);

  useEffect(() => {
    if (!id) return;
    consultationAPI
      .getConsultationById(id)
      .then((data) => {
        setFormData({
          date: data.date,
          g_name: data.g_name,
          profession: data.profession,
          department: data.department,
          reason: data.reason,
          description: data.description ?? "",
          time_spent: data.time_spent ?? "",
          project_from: data.project_from ?? "",
          progress: data.progress ?? "",
          payment_status: data.payment_status,
          report_submission_date: data.report_submission_date ?? "",
          amount: data.amount ?? "",
          status: data.status,
        });
      })
      .catch(() => setFetchError("Failed to load consultation"))
      .finally(() => setFetchLoading(false));

    // Check if this consultation has a conflict
    consultationAPI.getConflictNotifications().then((conflicts) => {
      const match = conflicts.find((c) => c.consultation_id === id);
      setConflict(match ?? null);
    }).catch(() => {/* silently ignore */});
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
          }
        : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData) return;

    setSubmitLoading(true);
    setSubmitError("");

    // Strip empty optional fields — backend rejects "" for numeric/date types
    const raw = { ...formData } as Record<string, unknown>;
    if (!raw.report_submission_date) delete raw.report_submission_date;
    if (!raw.progress) delete raw.progress;
    if (!raw.project_from) delete raw.project_from;
    if (raw.time_spent === "") delete raw.time_spent;
    if (raw.amount === "") delete raw.amount;
    const payload = raw as Partial<ConsultationFormData>;

    try {
      await consultationAPI.updateConsultation(id, payload);
      navigate("/consultations");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; detail?: string } };
      };
      setSubmitError(
        axiosErr.response?.data?.message ??
          axiosErr.response?.data?.detail ??
          "Failed to update consultation"
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (fetchLoading) return <LoadingSpinner message="Loading consultation..." />;

  if (fetchError || !formData) {
    return (
      <div className="rounded-lg border border-error-300 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {fetchError || "Consultation not found"}
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Edit Consultation | CMA" description="Edit a consultation entry" />
      <PageBreadcrumb pageTitle="Edit Consultation" />

      {/* Conflict warning banner */}
      {conflict && (
        <div className="mb-4 rounded-xl border border-error-300 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-error-700 dark:text-error-400">Conflict detected</p>
              <p className="mt-0.5 text-sm text-error-600 dark:text-error-300">
                <span className="font-medium">{conflict.g_name}</span> ({conflict.profession} · {conflict.department}) is also consulting{" "}
                <span className="font-medium">{conflict.other_username}</span> for "{conflict.other_reason}".
              </p>
              <p className="mt-1 text-xs text-error-500 dark:text-error-400">
                Resolve by coordinating with {conflict.other_username}, or cancel this consultation if it's a duplicate.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!id || !formData) return;
                if (!window.confirm("Cancel this consultation to resolve the conflict?")) return;
                try {
                  await consultationAPI.updateConsultation(id, { status: "Cancelled" });
                  navigate("/");
                } catch {
                  alert("Failed to cancel. Please use the form below.");
                }
              }}
              className="shrink-0 rounded-lg border border-error-300 bg-white px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:bg-transparent dark:text-error-400 dark:hover:bg-error-500/10"
            >
              Cancel consultation
            </button>
          </div>
        </div>
      )}

      <ComponentCard
        title="Edit Entry"
        desc="Update the consultation details below."
      >
        {submitError && (
          <div className="rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">
                Date <span className="text-error-500">*</span>
              </Label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="g_name">
                Name <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                id="g_name"
                name="g_name"
                value={formData.g_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>
                Profession <span className="text-error-500">*</span>
              </Label>
              <Select
                options={professionOptions}
                defaultValue={formData.profession}
                onChange={(value) =>
                  setFormData((prev) => prev ? { ...prev, profession: value } : prev)
                }
              />
            </div>

            <div>
              <Label htmlFor="department">
                Department <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>
                Reason <span className="text-error-500">*</span>
              </Label>
              <Select
                options={reasonOptions}
                defaultValue={formData.reason}
                onChange={(value) =>
                  setFormData((prev) => prev ? { ...prev, reason: value } : prev)
                }
              />
            </div>

            <div>
              <Label htmlFor="time_spent">
                Time Spent (minutes){" "}
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </Label>
              <Input
                type="number"
                id="time_spent"
                name="time_spent"
                min="0"
                value={formData.time_spent}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="project_from">
                Project From{" "}
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </Label>
              <Input
                type="text"
                id="project_from"
                name="project_from"
                value={formData.project_from}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                options={statusOptions}
                defaultValue={formData.status ?? "In Progress"}
                onChange={(value) =>
                  setFormData((prev) => prev ? { ...prev, status: value } : prev)
                }
              />
            </div>

            <div>
              <Label>Payment Status</Label>
              <Select
                options={paymentStatusOptions}
                defaultValue={formData.payment_status ?? "Not Required"}
                onChange={(value) =>
                  setFormData((prev) => prev ? { ...prev, payment_status: value } : prev)
                }
              />
            </div>

            <div>
              <Label htmlFor="amount">
                Amount (₹){" "}
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                min="0"
                placeholder="0.00"
                value={formData.amount ?? ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="report_submission_date">
                Report Submission Date{" "}
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </Label>
              <Input
                type="date"
                id="report_submission_date"
                name="report_submission_date"
                value={formData.report_submission_date ?? ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">
              Description <span className="text-error-500">*</span>
            </Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div>
            <Label htmlFor="progress">
              Progress{" "}
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </Label>
            <textarea
              id="progress"
              name="progress"
              rows={2}
              placeholder="Any progress notes..."
              value={formData.progress ?? ""}
              onChange={handleChange}
              className="h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/consultations")}>
              Cancel
            </Button>
            <Button size="sm" disabled={submitLoading}>
              {submitLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
