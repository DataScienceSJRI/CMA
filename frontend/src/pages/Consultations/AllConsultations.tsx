import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ConsultationTable from "../../components/cma/ConsultationTable";
import InvoiceModal from "../../components/cma/InvoiceModal";
import AssignModal from "../../components/cma/AssignModal";
import { consultationAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Consultation } from "../../types";

export default function AllConsultations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHOD = user?.role === "HOD";
  const isFaculty = user?.role === "Faculty";
  const canInvoice = isHOD || isFaculty;

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [invoiceTarget, setInvoiceTarget] = useState<Consultation | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Consultation | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await consultationAPI.getAllConsultations();
        setConsultations(data);
      } catch (err) {
        setError("Failed to load consultations.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleReassigned = (consultationId: string) => {
    setConsultations((prev) => prev.filter((c) => c.consultation_id !== consultationId));
    setReassignTarget(null);
  };

  return (
    <>
      <PageMeta title="Consultations | CMA" description="All consultations" />
      <PageBreadcrumb pageTitle="Consultations" />

      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        {/* Table (has built-in search + status + payment filters) */}
        <ConsultationTable
          consultations={consultations}
          loading={loading}
          onEdit={(id) => navigate(`/consultation/${id}/edit`)}
          onReassign={isFaculty ? (c) => setReassignTarget(c) : undefined}
          onInvoice={canInvoice ? (c) => setInvoiceTarget(c) : undefined}
          showActions
        />
      </div>

      {/* Reassign Modal */}
      <AssignModal
        consultation={reassignTarget}
        onClose={() => setReassignTarget(null)}
        onAssigned={handleReassigned}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        consultation={invoiceTarget}
        onClose={() => setInvoiceTarget(null)}
      />
    </>
  );
}
