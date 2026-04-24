import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";
import type { Consultation } from "../../types";

interface ConsultationTableProps {
  consultations: Consultation[];
  loading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReassign?: (consultation: Consultation) => void;
  onInvoice?: (consultation: Consultation) => void;
  onUpdate?: (id: string, field: "status" | "payment_status", value: string) => void;
  showActions?: boolean;
  itemsPerPage?: number;
}

export default function ConsultationTable({
  consultations,
  loading,
  onEdit,
  onDelete,
  onReassign,
  onInvoice,
  onUpdate,
  showActions = true,
  itemsPerPage = 10,
}: ConsultationTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = consultations.filter((c) => {
    const matchesSearch =
      c.g_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.department?.toLowerCase().includes(search.toLowerCase()) ||
      c.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesPayment = !paymentFilter || c.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    const color =
      status === "Completed"
        ? "success"
        : status === "In Progress"
        ? "warning"
        : "light";
    return (
      <Badge size="sm" color={color as "success" | "warning" | "light"}>
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const color =
      paymentStatus === "Paid"
        ? "success"
        : paymentStatus === "Not Paid"
        ? "error"
        : "light";
    return (
      <Badge size="sm" color={color as "success" | "error" | "light"}>
        {paymentStatus}
      </Badge>
    );
  };

  if (loading) return <LoadingSpinner message="Loading consultations..." />;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
      {/* Search + filter header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          Consultations
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All Payments</option>
            <option value="Not Required">Not Required</option>
            <option value="Not Paid">Not Paid</option>
            <option value="Paid">Paid</option>
          </select>
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 w-48 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No consultations found"
          description="Try adjusting your search or create a new consultation."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-800">
                <TableCell
                  isHeader
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Department
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Reason
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Payment
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Amount
                </TableCell>
                {showActions && (
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((c) => (
                <TableRow
                  key={c.consultation_id}
                  className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                >
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                    {new Date(c.date + "T00:00:00").toLocaleDateString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    {c.g_name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {c.department}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {c.reason}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4">
                    {onUpdate ? (
                      <select
                        value={c.status}
                        onChange={(e) => onUpdate(c.consultation_id, "status", e.target.value)}
                        className="rounded-full border-0 bg-transparent py-0.5 pl-2 pr-6 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer
                          data-[status=Completed]:text-success-600 data-[status=In Progress]:text-warning-600 data-[status=Cancelled]:text-gray-500
                          dark:text-white/80"
                        style={{
                          color: c.status === "Completed" ? "var(--color-success-600, #16a34a)"
                               : c.status === "In Progress" ? "var(--color-warning-600, #d97706)"
                               : "#6b7280"
                        }}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : getStatusBadge(c.status)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4">
                    {onUpdate ? (
                      <select
                        value={c.payment_status}
                        onChange={(e) => onUpdate(c.consultation_id, "payment_status", e.target.value)}
                        className="rounded-full border-0 bg-transparent py-0.5 pl-2 pr-6 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                        style={{
                          color: c.payment_status === "Paid" ? "var(--color-success-600, #16a34a)"
                               : c.payment_status === "Not Paid" ? "var(--color-error-600, #dc2626)"
                               : "#6b7280"
                        }}
                      >
                        <option value="Not Required">Not Required</option>
                        <option value="Not Paid">Not Paid</option>
                        <option value="Paid">Paid</option>
                      </select>
                    ) : getPaymentBadge(c.payment_status)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-800 dark:text-white/90">
                    {c.amount != null ? `₹${c.amount.toLocaleString()}` : "—"}
                  </TableCell>
                  {showActions && (
                    <TableCell className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(c.consultation_id)}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >
                            View
                          </button>
                        )}
                        {onReassign && c.status === "In Progress" && (
                          <button
                            onClick={() => onReassign(c)}
                            className="text-warning-500 hover:text-warning-600 dark:text-warning-400"
                          >
                            Delegate →
                          </button>
                        )}
                        {onInvoice && c.status === "Completed" && (
                          <button
                            onClick={() => onInvoice(c)}
                            className="text-success-500 hover:text-success-600 dark:text-success-400"
                          >
                            Invoice
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(c.consultation_id)}
                            className="text-error-500 hover:text-error-600 dark:text-error-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
