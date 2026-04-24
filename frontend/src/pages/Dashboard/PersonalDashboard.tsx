import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import StatCard from "../../components/cma/StatCard";
import ConsultationBarChart from "../../components/cma/ConsultationBarChart";
import ConsultationTable from "../../components/cma/ConsultationTable";
import AssignModal from "../../components/cma/AssignModal";
import InvoiceModal from "../../components/cma/InvoiceModal";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { consultationAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Consultation, PendingConsultation } from "../../types";


export default function PersonalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAssign = user?.role === "HOD" || user?.role === "Faculty";

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pending, setPending] = useState<PendingConsultation[]>([]);
  const [assignTarget, setAssignTarget] = useState<PendingConsultation | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<Consultation | null>(null);

  useEffect(() => {
    loadConsultations();
    if (canAssign) loadPending();
  }, [canAssign]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const data = await consultationAPI.getPersonalConsultations({ page_size: 200 });
      setConsultations(data);
      setError("");
    } catch (err) {
      setError("Failed to load consultations");
      console.error("Error loading consultations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    try {
      const data = await consultationAPI.getPendingConsultations();
      setPending(data);
    } catch (err) {
      console.error("Failed to load pending consultations:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this consultation?")) return;
    try {
      await consultationAPI.deleteConsultation(id);
      setConsultations((prev) => prev.filter((c) => c.consultation_id !== id));
    } catch {
      alert("Failed to delete consultation");
    }
  };

  const handleUpdate = async (id: string, field: "status" | "payment_status", value: string) => {
    try {
      await consultationAPI.updateConsultation(id, { [field]: value });
      setConsultations((prev) =>
        prev.map((c) => (c.consultation_id === id ? { ...c, [field]: value } : c))
      );
    } catch {
      alert("Failed to update. Please try again.");
    }
  };

  const handleAssigned = (consultationId: string) => {
    setPending((prev) => prev.filter((c) => c.consultation_id !== consultationId));
    // If Faculty delegated one of their own consultations, remove it from personal list too
    setConsultations((prev) => prev.filter((c) => c.consultation_id !== consultationId));
    setAssignTarget(null);
  };

  // Stats
  const totalConsultations = consultations.length;
  const completedCount = consultations.filter((c) => c.status === "Completed").length;
  const inProgressCount = consultations.filter((c) => c.status === "In Progress").length;
  const totalTime = consultations.reduce((sum, c) => sum + (c.time_spent || 0), 0);

  // Monthly chart — sorted by "YYYY-MM"
  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyMap: Record<string, number> = {};
  consultations.forEach((c) => {
    const d = new Date(c.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });
  const sortedKeys = Object.keys(monthlyMap).sort();
  const months = sortedKeys.map((k) => MONTH_LABELS[parseInt(k.split("-")[1], 10) - 1]);
  const counts = sortedKeys.map((k) => monthlyMap[k]);

  return (
    <>
      <PageMeta title="Personal Dashboard | CMA" description="Personal consultation dashboard" />
      <PageBreadcrumb pageTitle="Personal Dashboard" />

      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex justify-end">
          <Button size="sm" onClick={() => navigate("/new-consultation")}>
            + New Consultation
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        {/* ── Pending Assignments (HOD / Faculty only) ────────────────────── */}
        {canAssign && pending.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-warning-200 bg-white dark:border-warning-500/30 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-warning-200 bg-warning-50 px-6 py-4 dark:border-warning-500/30 dark:bg-warning-500/10">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-medium text-warning-700 dark:text-warning-400">
                  Pending Assignments
                </h3>
                <Badge size="sm" color="warning">{pending.length}</Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 dark:border-gray-800">
                    {["Client", "Profession", "Department", "Reason", "Submitted"].map((h) => (
                      <TableCell
                        key={h}
                        isHeader
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </TableCell>
                    ))}
                    <TableCell isHeader className="px-6 py-3">{""}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((p) => (
                    <TableRow
                      key={p.consultation_id}
                      className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {p.g_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.profession}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.department}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.reason}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          onClick={() => setAssignTarget(p)}
                          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >
                          Assign →
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Consultations"
            value={totalConsultations}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="Completed"
            value={completedCount}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="In Progress"
            value={inProgressCount}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Time (min)"
            value={totalTime}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

        {/* Chart */}
        {months.length > 0 && (
          <ConsultationBarChart categories={months} data={counts} title="Monthly Consultations" />
        )}

        {/* Consultations Table */}
        <ConsultationTable
          consultations={consultations}
          loading={loading}
          onEdit={(id) => navigate(`/consultation/${id}/edit`)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onReassign={user?.role === "Faculty" ? (c) => setAssignTarget(c) : undefined}
          onInvoice={canAssign ? (c) => setInvoiceTarget(c) : undefined}
        />
      </div>

      {/* Assign Modal */}
      <AssignModal
        consultation={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
        isPending={pending.some((p) => p.consultation_id === assignTarget?.consultation_id)}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        consultation={invoiceTarget}
        onClose={() => setInvoiceTarget(null)}
      />
    </>
  );
}
