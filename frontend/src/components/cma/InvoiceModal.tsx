import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { invoiceAPI } from "../../services/api";
import type { Consultation, InvoiceSendData } from "../../types";

interface InvoiceModalProps {
  consultation: Consultation | null;
  onClose: () => void;
}

export default function InvoiceModal({ consultation, onClose }: InvoiceModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<InvoiceSendData>({
    consultation_id: "",
    invoice_date: today,
    to_name: "",
    through_name: "",
    department: "",
    particulars: "",
    amount: 0,
    taken_by: "",
    recipient_email: "shameem@sjri.res.in",
  });
  const [invoiceNumber, setInvoiceNumber] = useState("SJRI/—/—");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!consultation) return;
    setForm({
      consultation_id: consultation.consultation_id,
      invoice_date: today,
      to_name: consultation.g_name ?? "",
      through_name: consultation.responsible_username ?? "",
      department: consultation.department ?? "",
      particulars: consultation.reason ?? "",
      amount: 0,
      taken_by: consultation.responsible_username ?? "",
      recipient_email: "shameem@sjri.res.in",
    });
    setSent(false);
    setError("");
    invoiceAPI
      .getNextNumber()
      .then((r) => setInvoiceNumber(r.invoice_number))
      .catch(() => setInvoiceNumber("SJRI/—/—"));
  }, [consultation]);

  const set = (field: keyof InvoiceSendData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSend = async () => {
    if (!form.to_name || !form.particulars || !form.recipient_email) {
      setError("Please fill in Name, Particulars, and Recipient Email.");
      return;
    }
    if (!form.amount || form.amount < 1) {
      setError("Amount must be at least Rs. 1.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await invoiceAPI.send(form);
      setSent(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; message?: string } } })
          .response?.data?.detail ??
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ??
        "Failed to send invoice.";
      setError(msg);
    } finally {
      setLoading(false);

    }
  };

  const invoiceDateDisplay = form.invoice_date
    ? new Date(form.invoice_date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print-area,
          #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            display: block !important;
          }
        }
        #invoice-print-area { display: none; }
      `}</style>

      {/* Hidden print area */}
      <div id="invoice-print-area">
        <InvoicePreview
          invoiceNumber={invoiceNumber}
          form={form}
          invoiceDateDisplay={invoiceDateDisplay}
        />
      </div>

      <Modal
        isOpen={!!consultation}
        onClose={onClose}
        className="max-w-5xl p-0 overflow-hidden"
      >
        {sent ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/10">
              <svg
                className="h-8 w-8 text-success-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">
              Invoice Sent
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">{invoiceNumber}</span> has been
              emailed to{" "}
              <span className="font-medium">{form.recipient_email}</span>.
            </p>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          /* Two-panel layout */
          <div className="flex" style={{ height: "80vh", maxHeight: "720px" }}>
            {/* Left: form */}
            <div
              className="shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-white/[0.02]"
              style={{ width: "300px" }}
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Invoice Details
              </h3>

              <div className="space-y-3">
                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={form.invoice_date}
                    onChange={(e) => set("invoice_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label>To (Client Name)</Label>
                  <Input
                    type="text"
                    value={form.to_name}
                    onChange={(e) => set("to_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Through (Faculty / HOD)</Label>
                  <Input
                    type="text"
                    value={form.through_name ?? ""}
                    onChange={(e) => set("through_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input
                    type="text"
                    value={form.department}
                    onChange={(e) => set("department", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Particulars</Label>
                  <textarea
                    value={form.particulars}
                    onChange={(e) => set("particulars", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-white/[0.04] dark:text-white/90"
                  />
                </div>
                <div>
                  <Label>Amount (Rs.)</Label>
                  <Input
                    type="number"
                    value={String(form.amount)}
                    onChange={(e) =>
                      set("amount", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>Consultation Taken By</Label>
                  <Input
                    type="text"
                    value={form.taken_by ?? ""}
                    onChange={(e) => set("taken_by", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Recipient Email</Label>
                  <Input
                    type="email"
                    value={form.recipient_email}
                    onChange={(e) => set("recipient_email", e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-3 rounded-lg border border-error-300 bg-error-50 p-2 text-xs text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-2">
                <Button size="sm" onClick={handleSend} disabled={loading}>
                  {loading ? "Sending…" : "Send Invoice"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                >
                  Print Preview
                </Button>
                <Button size="sm" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>

            {/* Right: live invoice preview */}
            <div className="flex-1 overflow-y-auto bg-white p-8 dark:bg-gray-950">
              <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                Preview
              </div>
              <InvoicePreview
                invoiceNumber={invoiceNumber}
                form={form}
                invoiceDateDisplay={invoiceDateDisplay}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ── Amount to words (Indian system) ─────────────────────────────────────────

function amountInWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const twoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  };

  let n = Math.floor(amount);
  if (n === 0) return "Zero";
  const parts: string[] = [];
  if (n >= 10_000_000) { parts.push(twoDigits(Math.floor(n / 10_000_000)) + " Crore"); n %= 10_000_000; }
  if (n >= 100_000)    { parts.push(twoDigits(Math.floor(n / 100_000)) + " Lakh");    n %= 100_000; }
  if (n >= 1_000)      { parts.push(twoDigits(Math.floor(n / 1_000)) + " Thousand");  n %= 1_000; }
  if (n >= 100)        { parts.push(ones[Math.floor(n / 100)] + " Hundred");           n %= 100; }
  if (n > 0)             parts.push(twoDigits(n));
  return "Rupees " + parts.join(" ") + " Only";
}


// ── Invoice preview (shared between modal and print) ─────────────────────────

function InvoicePreview({
  invoiceNumber,
  form,
  invoiceDateDisplay,
}: {
  invoiceNumber: string;
  form: InvoiceSendData;
  invoiceDateDisplay: string;
}) {
  const amt = Number(form.amount) || 0;
  const amountNum = amt.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const amountWords = amt > 0 ? amountInWords(amt) : "—";

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#111",
        width: "100%",
        maxWidth: "620px",
        margin: "0 auto",
        border: "1px solid #bbb",
        padding: "28px 36px",
        backgroundColor: "#fff",
      }}
    >
      {/* ── Header: logo | institution | address ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", borderBottom: "2px solid #111", paddingBottom: "12px", marginBottom: "20px" }}>
        {/* Logo */}
        <img src="/images/logo/sjrilogo.png" alt="SJRI" style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }} />

        {/* Institution name */}
        <div style={{ flex: 1, textAlign: "center", paddingTop: "4px" }}>
          <div style={{ fontWeight: "bold", fontSize: "16px", letterSpacing: "0.5px" }}>
            ST. JOHN'S NATIONAL ACADEMY OF HEALTH SCIENCES
          </div>
          <div style={{ fontWeight: "bold", fontSize: "14px", marginTop: "2px" }}>
            ST. JOHN'S RESEARCH INSTITUTE
          </div>
          <div style={{ fontSize: "11px", fontStyle: "italic", marginTop: "4px", color: "#444" }}>
            (A Unit of CBCI Society for Medical Education)
          </div>
        </div>

        {/* Address */}
        <div style={{ fontSize: "11px", lineHeight: "1.6", color: "#333", textAlign: "right", flexShrink: 0 }}>
          Sarjapur Road,<br />
          Bangalore – 560 034,<br />
          Tel: +91-80-4946 7001<br />
          E-mail: deansoffice@sjri.res.in
        </div>
      </div>

      {/* ── Invoice No + Date ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "13px" }}>
        <div><strong>No: {invoiceNumber}</strong></div>
        <div>{invoiceDateDisplay}</div>
      </div>

      {/* ── To / Through / Department ── */}
      <div style={{ lineHeight: "1.8", marginBottom: "24px", fontSize: "13px" }}>
        <div>To,</div>
        <div>{form.to_name || "—"}</div>
        {form.through_name && <div>Through {form.through_name}</div>}
        <div>Department of {form.department || "—"}</div>
        <div>SJMC</div>
      </div>

      {/* ── INVOICE title ── */}
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px", textDecoration: "underline", marginBottom: "16px", letterSpacing: "1px" }}>
        INVOICE
      </div>

      {/* ── Particulars table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #555", padding: "7px 10px", textAlign: "left", background: "#f5f5f5", width: "60px" }}>Sl.No</th>
            <th style={{ border: "1px solid #555", padding: "7px 10px", textAlign: "center", background: "#f5f5f5" }}>Particulars</th>
            <th style={{ border: "1px solid #555", padding: "7px 10px", textAlign: "right", background: "#f5f5f5", width: "140px" }}>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #555", padding: "10px", verticalAlign: "top" }}></td>
            <td style={{ border: "1px solid #555", padding: "10px", verticalAlign: "top" }}>{form.particulars || "—"}</td>
            <td style={{ border: "1px solid #555", padding: "10px", textAlign: "right", verticalAlign: "top" }}>{amt > 0 ? amountNum : "—"}</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: "1px solid #555", padding: "8px 10px", fontWeight: "bold", textAlign: "center" }}>
              Grand Total: {amountWords}
            </td>
            <td style={{ border: "1px solid #555", padding: "8px 10px" }}></td>
          </tr>
        </tbody>
      </table>

      {/* ── Payment note ── */}
      <div style={{ marginTop: "20px", fontSize: "13px" }}>
        Kindly transfer payment to Biostatistics Cost Centre{" "}
        <strong>St.John's Research Institute A/c</strong>
      </div>

      {/* ── Signature ── */}
      <div style={{ marginTop: "40px", fontSize: "13px" }}>
        <div>Thanking You,</div>
        <div>Sincerely,</div>
        <div style={{ marginTop: "36px" }}>
          <div style={{ fontWeight: "bold" }}>Dr. TINKU THOMAS</div>
          <div>Professor &amp; Head</div>
          <div>Dept of Biostatistics</div>
          <div>St John's Medical College</div>
        </div>
      </div>

      {/* ── Taken by ── */}
      {form.taken_by && (
        <div style={{ marginTop: "24px", fontSize: "12px", textAlign: "right", color: "#444" }}>
          Consultation has been taken by {form.taken_by}
        </div>
      )}
    </div>
  );
}
