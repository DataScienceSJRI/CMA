import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import StatCard from "../../components/cma/StatCard";
import { reportAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { HierarchicalReport, FacultyStats, MemberStats } from "../../types";

// ── Utilities ─────────────────────────────────────────────────────────────────

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function Bar({ value, max, color = "bg-brand-500" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700/60">
      <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct(value, max)}%` }} />
    </div>
  );
}

function Av({ name, size = "md", color = "brand" }: { name: string; size?: "sm" | "md"; color?: string }) {
  const sz = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const cls: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold ${sz} ${cls[color] ?? cls.brand}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${color}`}>{children}</span>;
}

// ── PDF generation ────────────────────────────────────────────────────────────

type DocWithTable = jsPDF & { lastAutoTable: { finalY: number } };
const BRAND_RGB: [number, number, number] = [79, 70, 229];
const LIGHT_RGB: [number, number, number] = [248, 248, 252];

function buildPeriodLabel(report: HierarchicalReport): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(report.date_from)} – ${fmt(report.date_to)}`;
}

function downloadPDF(report: HierarchicalReport, isHOD: boolean, hodUsername: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as DocWithTable;
  const W = 210;
  const M = 14;
  let y = 14;

  const addSection = (title: string) => {
    y += 4;
    doc.setFillColor(...BRAND_RGB);
    doc.rect(M, y, W - M * 2, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), M + 3, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 10;
  };

  // Header banner
  doc.setFillColor(...BRAND_RGB);
  doc.rect(0, 0, W, 24, "F");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Consultation Report", M, 11);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${buildPeriodLabel(report)}`, M, 18);
  y = 30;

  // Overview
  addSection("Overview");
  const overviewRows: (string | number)[][] = [
    ["Total Consultations", report.total],
    ["Completed", `${report.completed}  (${pct(report.completed, report.total)}%)`],
    ["In Progress", report.in_progress],
  ];
  if (isHOD && (report.hod_own_total ?? 0) > 0) {
    overviewRows.push([`${hodUsername}'s own consultations`, report.hod_own_total!]);
  }
  autoTable(doc, {
    startY: y, head: [], body: overviewRows,
    margin: { left: M, right: M },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 90, fontStyle: "bold", fillColor: LIGHT_RGB }, 1: { cellWidth: 80 } },
    theme: "plain",
  });
  y = doc.lastAutoTable.finalY + 6;

  if (isHOD) {
    // HOD direct team
    const directMembers = report.hod_direct_members ?? [];
    if (directMembers.length > 0) {
      addSection("My Direct Team");
      autoTable(doc, {
        startY: y,
        head: [["#", "Member", "Completed", "In Progress", "Total"]],
        body: directMembers.map((m, i) => [i + 1, m.username, m.completed, m.in_progress, m.total]),
        margin: { left: M, right: M },
        headStyles: { fillColor: BRAND_RGB, textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: LIGHT_RGB },
        columnStyles: { 0: { cellWidth: 10 } },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    // Faculty summary table
    const faculties = (report.departments ?? []).flatMap((d) => d.faculties);
    addSection("Faculty Summary");
    autoTable(doc, {
      startY: y,
      head: [["#", "Faculty", "Own", "Team", "Total", "Done %"]],
      body: faculties.map((f, i) => [i + 1, f.username, f.own_total, f.member_total, f.grand_total, `${pct(f.completed, f.grand_total)}%`]),
      margin: { left: M, right: M },
      headStyles: { fillColor: BRAND_RGB, textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: LIGHT_RGB },
      columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 18 }, 3: { cellWidth: 18 }, 4: { cellWidth: 18 }, 5: { cellWidth: 22 } },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 6;

    // Per-faculty team member detail
    for (const f of faculties) {
      if (f.members.length === 0) continue;
      if (y > 250) { doc.addPage(); y = 14; }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND_RGB);
      doc.text(`${f.username}  —  Total: ${f.grand_total}  (own: ${f.own_total}, team: ${f.member_total})`, M, y);
      doc.setTextColor(0, 0, 0);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["#", "Team Member", "Completed", "In Progress", "Total"]],
        body: f.members.map((m, i) => [i + 1, m.username, m.completed, m.in_progress, m.total]),
        margin: { left: M + 6, right: M },
        headStyles: { fillColor: [220, 220, 240] as [number, number, number], textColor: 40, fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: LIGHT_RGB },
        columnStyles: { 0: { cellWidth: 10 } },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 5;
    }
  } else {
    // Faculty own + team
    const grandTotal = report.grand_total ?? report.total;
    const ownTotal = report.own_total ?? 0;
    const memberTotal = report.member_total ?? 0;

    addSection("My Activity");
    autoTable(doc, {
      startY: y, head: [],
      body: [
        ["My Consultations", `${ownTotal}  (${pct(ownTotal, grandTotal)}%)`],
        ["Team Consultations", `${memberTotal}  (${pct(memberTotal, grandTotal)}%)`],
        ["Grand Total", grandTotal],
        ["Completed", `${report.completed}  (${pct(report.completed, grandTotal)}%)`],
      ],
      margin: { left: M, right: M },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 90, fontStyle: "bold", fillColor: LIGHT_RGB }, 1: { cellWidth: 80 } },
      theme: "plain",
    });
    y = doc.lastAutoTable.finalY + 6;

    if ((report.members ?? []).length > 0) {
      addSection("Team Member Breakdown");
      autoTable(doc, {
        startY: y,
        head: [["#", "Team Member", "Completed", "In Progress", "Total"]],
        body: (report.members ?? []).map((m, i) => [i + 1, m.username, m.completed, m.in_progress, m.total]),
        margin: { left: M, right: M },
        headStyles: { fillColor: BRAND_RGB, textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: LIGHT_RGB },
        columnStyles: { 0: { cellWidth: 10 } },
        theme: "grid",
      });
    }
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, M, 290);
    doc.text(`Page ${i} / ${pages}`, W - M, 290, { align: "right" });
  }

  doc.save(`consultation-report-${report.date_from}.pdf`);
}

// ── Member sub-row ────────────────────────────────────────────────────────────
function MemberSubRow({ m, max }: { m: MemberStats; max: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Av name={m.username} size="sm" color="gray" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="truncate text-sm text-gray-700 dark:text-gray-300">{m.username}</span>
          <div className="flex shrink-0 items-center gap-2">
            {m.completed > 0 && <Chip color="bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">{m.completed} done</Chip>}
            <span className="w-6 text-right text-sm font-semibold text-gray-800 dark:text-white/80">{m.total}</span>
          </div>
        </div>
        <Bar value={m.total} max={max} color="bg-gray-400 dark:bg-gray-500" />
      </div>
    </div>
  );
}

// ── Faculty row ───────────────────────────────────────────────────────────────
function FacultyRow({ f, rank, max }: { f: FacultyStats; rank: number; max: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700/60 dark:bg-white/[0.02]">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <span className="w-5 shrink-0 text-center text-xs font-semibold text-gray-400 dark:text-gray-600">{rank}</span>
        <Av name={f.username} color="brand" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{f.username}</span>
            <div className="flex items-center gap-1.5">
              <Chip color="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">{f.own_total} own</Chip>
              {f.member_total > 0 && <Chip color="bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">{f.member_total} team</Chip>}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1"><Bar value={f.grand_total} max={max} color="bg-brand-500" /></div>
            <span className="shrink-0 text-xs text-gray-400">{pct(f.completed, f.grand_total)}% done</span>
          </div>
        </div>
        <span className="text-xl font-bold text-gray-800 dark:text-white/80">{f.grand_total}</span>
        {f.members.length > 0 ? (
          <button onClick={() => setOpen((p) => !p)}
            className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-gray-300">
            <svg className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : <div className="ml-1 h-7 w-7 shrink-0" />}
      </div>
      {open && f.members.length > 0 && (
        <div className="border-t border-gray-100 px-4 pb-2 pt-0.5 dark:border-gray-700/60">
          <div className="divide-y divide-gray-100 pl-9 dark:divide-gray-700/40">
            {f.members.map((m) => <MemberSubRow key={m.user_id} m={m} max={f.grand_total} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── HOD view ──────────────────────────────────────────────────────────────────
function HODReportView({ report, username }: { report: HierarchicalReport; username: string }) {
  const faculties = (report.departments ?? []).flatMap((d) => d.faculties);
  const max = faculties.reduce((m, f) => Math.max(m, f.grand_total), 0);
  const hodOwn = report.hod_own_total ?? 0;
  const directMembers = report.hod_direct_members ?? [];
  const directMax = directMembers.reduce((m, dm) => Math.max(m, dm.total), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Consultations" value={report.total}
          accent="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard title="Completed" value={report.completed} sub={`${pct(report.completed, report.total)}% completion rate`}
          accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="In Progress" value={report.in_progress}
          accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* HOD's own consultations */}
      {hodOwn > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/50 px-5 py-3.5 dark:border-brand-500/20 dark:bg-brand-500/5">
          <Av name={username} color="brand" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">My consultations ({username})</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white/90">{hodOwn}</p>
          </div>
        </div>
      )}

      {/* HOD's direct team members */}
      {directMembers.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">My Direct Team</h3>
            <span className="text-sm text-gray-400">{directMembers.length} member{directMembers.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/40">
            {directMembers.map((m, i) => (
              <div key={m.user_id} className="flex items-center gap-4 py-3">
                <span className="w-4 shrink-0 text-center text-xs font-semibold text-gray-400">{i + 1}</span>
                <Av name={m.username} size="sm" color="purple" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{m.username}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {m.completed > 0 && <Chip color="bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">{m.completed} done</Chip>}
                      {m.in_progress > 0 && <Chip color="bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">{m.in_progress} active</Chip>}
                      <span className="w-6 text-right text-sm font-bold text-gray-800 dark:text-white/80">{m.total}</span>
                    </div>
                  </div>
                  <Bar value={m.total} max={directMax || 1} color="bg-purple-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faculty breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Faculty Breakdown</h3>
          <span className="text-sm text-gray-400">{faculties.length} faculty · expand to see team</span>
        </div>
        {faculties.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No faculty data for this period.</p>
        ) : (
          <div className="space-y-2.5">
            {faculties.map((f, i) => <FacultyRow key={f.user_id} f={f} rank={i + 1} max={max} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Faculty view ──────────────────────────────────────────────────────────────
function FacultyReportView({ report }: { report: HierarchicalReport }) {
  const grandTotal = report.grand_total ?? report.total;
  const ownTotal = report.own_total ?? 0;
  const memberTotal = report.member_total ?? 0;
  const members = report.members ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total (Group)" value={grandTotal} sub="own + team"
          accent="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard title="My Consultations" value={ownTotal} sub={`${pct(ownTotal, grandTotal)}% of total`}
          accent="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard title="Team Consultations" value={memberTotal} sub={`${pct(memberTotal, grandTotal)}% of total`}
          accent="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="Completed" value={report.completed} sub={`${pct(report.completed, grandTotal)}% completion`}
          accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Group Activity</h3>

        <div className="mb-5 space-y-3">
          {[
            { label: "My consultations", val: ownTotal, color: "bg-blue-500" },
            { label: "Team consultations", val: memberTotal, color: "bg-purple-500" },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                </div>
                <span className="font-semibold text-gray-800 dark:text-white/80">
                  {val} <span className="font-normal text-gray-400">/ {pct(val, grandTotal)}%</span>
                </span>
              </div>
              <Bar value={val} max={grandTotal} color={color} />
            </div>
          ))}
        </div>

        {members.length > 0 && (
          <>
            <div className="mb-3 border-t border-gray-200 pt-4 dark:border-gray-700/60">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Team Members</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/40">
              {members.map((m, i) => (
                <div key={m.user_id} className="flex items-center gap-4 py-3">
                  <span className="w-4 shrink-0 text-center text-xs font-semibold text-gray-400">{i + 1}</span>
                  <Av name={m.username} size="sm" color="purple" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{m.username}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {m.completed > 0 && <Chip color="bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">{m.completed} done</Chip>}
                        {m.in_progress > 0 && <Chip color="bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">{m.in_progress} active</Chip>}
                        <span className="w-6 text-right text-sm font-bold text-gray-800 dark:text-white/80">{m.total}</span>
                      </div>
                    </div>
                    <Bar value={m.total} max={grandTotal} color="bg-purple-400" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {members.length === 0 && <p className="py-4 text-center text-sm text-gray-400">No team members assigned.</p>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const { user } = useAuth();
  const isHOD = user?.role === "HOD";

  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<HierarchicalReport | null>(null);
  const [error, setError] = useState("");

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i).toLocaleString("default", { month: "long" }),
  }));
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: String(y), label: String(y) };
  });

  const handleGenerate = async () => {
    if (reportType === "daterange" && (!startDate || !endDate)) {
      setError("Please select both a start and end date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let params: Parameters<typeof reportAPI.getHierarchicalReport>[0] = {};
      if (reportType === "monthly") {
        params = { year: Number(selectedYear), month: Number(selectedMonth) };
      } else if (reportType === "yearly") {
        params = { start_date: `${selectedYear}-01-01`, end_date: `${selectedYear}-12-31` };
      } else {
        params = { start_date: startDate, end_date: endDate };
      }
      setReport(await reportAPI.getHierarchicalReport(params));
    } catch {
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Reports | CMA" description="Generate consultation reports" />
      <PageBreadcrumb pageTitle="Reports" />

      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label>Type</Label>
              <Select
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                  { value: "daterange", label: "Date Range" },
                ]}
                onChange={(val) => { setReportType(val); setReport(null); }}
                defaultValue={reportType}
              />
            </div>
            {reportType === "monthly" && (
              <>
                <div><Label>Month</Label><Select options={monthOptions} onChange={setSelectedMonth} defaultValue={selectedMonth} /></div>
                <div><Label>Year</Label><Select options={yearOptions} onChange={setSelectedYear} defaultValue={selectedYear} /></div>
              </>
            )}
            {reportType === "yearly" && (
              <div><Label>Year</Label><Select options={yearOptions} onChange={setSelectedYear} defaultValue={selectedYear} /></div>
            )}
            {reportType === "daterange" && (
              <>
                <div><Label>From</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                <div><Label>To</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              </>
            )}
            <Button size="sm" onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating…" : "Generate Report"}
            </Button>
          </div>

          {report && (
            <button
              onClick={() => downloadPDF(report, isHOD, user?.username ?? "HOD")}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg className="h-7 w-7 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {!loading && report && (
          isHOD
            ? <HODReportView report={report} username={user?.username ?? "HOD"} />
            : <FacultyReportView report={report} />
        )}

        {!loading && !report && (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">
            <svg className="mx-auto mb-3 h-14 w-14 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">Select a period and click Generate Report</p>
          </div>
        )}
      </div>
    </>
  );
}
