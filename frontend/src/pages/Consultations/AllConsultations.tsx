import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ConsultationTable from "../../components/cma/ConsultationTable";
import InvoiceModal from "../../components/cma/InvoiceModal";
import AssignModal from "../../components/cma/AssignModal";
import { consultationAPI, userAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Consultation, FacultyUser, ManagedMember } from "../../types";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

const PAYMENT_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "Paid", label: "Paid" },
  { value: "Not Paid", label: "Not Paid" },
  { value: "Not Required", label: "Not Required" },
];

export default function AllConsultations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHOD = user?.role === "HOD";
  const isFaculty = user?.role === "Faculty";
  const canInvoice = isHOD || isFaculty;

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");

  // Data
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // User options for "Assigned To" filter
  const [assignableUsers, setAssignableUsers] = useState<{ value: string; label: string }[]>([]);

  // Modals
  const [invoiceTarget, setInvoiceTarget] = useState<Consultation | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Consultation | null>(null);


  // Load assignable users (faculty for HOD, managed members for Faculty)
  useEffect(() => {
    if (!user) return;
    const loadUsers = async () => {
      try {
        if (isHOD && user.department) {
          const faculty = await userAPI.getFacultyByDepartment(user.department);
          setAssignableUsers(
            faculty.map((f: FacultyUser) => ({ value: f.user_id, label: f.username }))
          );
        } else if (isFaculty) {
          const members = await userAPI.getFacultyManagedMembers(user.user_id);
          const opts = [
            { value: user.user_id, label: `${user.username} (me)` },
            ...members.map((m: ManagedMember) => ({
              value: m.managed_member_user_id,
              label: m.member_username || m.managed_member_user_id,
            })),
          ];
          setAssignableUsers(opts);
        }
      } catch {
        // non-critical, silently ignore
      }
    };
    loadUsers();
  }, [user, isHOD, isFaculty]);

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: { status?: string; payment_status?: string; assigned_to_user_id?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.payment_status = paymentFilter;
      if (assignedToFilter) params.assigned_to_user_id = assignedToFilter;
      const data = await consultationAPI.getAllConsultations(params);
      setConsultations(data);
    } catch (err) {
      setError("Failed to load consultations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, assignedToFilter]);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const handleReassigned = (consultationId: string) => {
    setConsultations((prev) => prev.filter((c) => c.consultation_id !== consultationId));
    setReassignTarget(null);
  };

  const selectClass =
    "h-9 rounded-lg border border-gray-300 bg-transparent px-3 pr-8 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

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

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter:
          </span>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="dark:bg-gray-900">
                {o.label}
              </option>
            ))}
          </select>

          {/* Payment */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className={selectClass}
          >
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="dark:bg-gray-900">
                {o.label}
              </option>
            ))}
          </select>

          {/* Assigned To (HOD & Faculty only) */}
          {(isHOD || isFaculty) && assignableUsers.length > 0 && (
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className={selectClass}
            >
              <option value="" className="dark:bg-gray-900">All Members</option>
              {assignableUsers.map((u) => (
                <option key={u.value} value={u.value} className="dark:bg-gray-900">
                  {u.label}
                </option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {(statusFilter || paymentFilter || assignedToFilter) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setPaymentFilter("");
                setAssignedToFilter("");
              }}
              className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              Clear filters
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">
            {loading ? "" : `${consultations.length} result${consultations.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Table */}
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
