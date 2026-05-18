import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import LoadingSpinner from "../../components/cma/LoadingSpinner";
import Badge from "../../components/ui/badge/Badge";
import { consultationAPI } from "../../services/api";
import type { Consultation } from "../../types";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-800 dark:text-white/90">
        {value != null && value !== "" ? String(value) : "—"}
      </p>
    </div>
  );
}

export default function ViewConsultation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    consultationAPI
      .getConsultationById(id)
      .then(setData)
      .catch(() => setError("Failed to load consultation"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading consultation..." />;

  if (error || !data) {
    return (
      <div className="rounded-lg border border-error-300 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {error || "Consultation not found"}
      </div>
    );
  }

  const statusColor =
    data.status === "Completed" ? "success" : data.status === "In Progress" ? "warning" : "light";
  const paymentColor =
    data.payment_status === "Paid" ? "success" : data.payment_status === "Not Paid" ? "error" : "light";

  return (
    <>
      <PageMeta title="View Consultation | CMA" description="View consultation details" />
      <PageBreadcrumb pageTitle="View Consultation" />

      <ComponentCard title="Consultation Details">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label="Date"
            value={new Date(data.date + "T00:00:00").toLocaleDateString("en-IN", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          />
          <Field label="Name" value={data.g_name} />
          <Field label="Profession" value={data.profession} />
          <Field label="Department" value={data.department} />
          <Field label="Reason" value={data.reason} />
          <Field label="Time Spent" value={data.time_spent != null ? `${data.time_spent} min` : null} />
          <Field label="Assigned To" value={data.responsible_username} />
          <Field label="Project From" value={data.project_from} />

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Status
            </p>
            <div className="mt-1">
              <Badge size="sm" color={statusColor as "success" | "warning" | "light"}>
                {data.status}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Payment
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge size="sm" color={paymentColor as "success" | "error" | "light"}>
                {data.payment_status}
              </Badge>
              {data.amount != null && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ₹{Number(data.amount).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          {data.report_submission_date && (
            <Field
              label="Report Submission Date"
              value={new Date(data.report_submission_date + "T00:00:00").toLocaleDateString("en-IN", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            />
          )}
        </div>

        {data.description && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Description
            </p>
            <p className="mt-1 text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
              {data.description}
            </p>
          </div>
        )}

        {data.progress && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Progress
            </p>
            <p className="mt-1 text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
              {data.progress}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/consultations")}>
            Back
          </Button>
        </div>
      </ComponentCard>
    </>
  );
}
