import { useState, useEffect } from "react";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { publicAPI } from "../../services/api";
import type { PublicUserResult } from "../../types";

const STAFF_DEPARTMENT = "Biostatistics";

const DEPARTMENT_GROUPS = [
  {
    institution: "SJMC",
    categories: [
      {
        label: "Preclinical Departments",
        departments: ["Anatomy", "Biochemistry", "Physiology"],
      },
      {
        label: "Paraclinical Departments",
        departments: ["Community Medicine", "Forensic Medicine", "Microbiology", "Pathology", "Pharmacology"],
      },
      {
        label: "Clinical Departments",
        departments: [
          "Anesthesiology", "Dental Surgery", "Dermatology", "Emergency Medicine",
          "Family Medicine", "General Medicine", "General Surgery",
          "Obstetrics & Gynaecology", "Ophthalmology", "Orthopaedics",
          "Otolaryngology (ENT)", "Paediatrics",
          "Physical Medicine & Rehabilitation (PMR)", "Psychiatry",
          "Radiology (Radiodiagnosis)", "Transfusion Medicine and Immunohematology",
        ],
      },
      {
        label: "Superspeciality Departments",
        departments: [
          "Cardiology", "Cardiothoracic and Vascular Surgery",
          "Clinical Immunology and Rheumatology", "Clinical Hematology",
          "Critical Care Medicine", "Endocrinology", "Gastroenterology",
          "Gynaecological Oncology", "Medical Oncology", "Neonatology",
          "Nephrology", "Neurology", "Neurosurgery",
          "Pain, Palliative Medicine and Supportive Care", "Pediatric Intensive Care",
          "Paediatric Nephrology", "Paediatric Surgery",
          "Pediatric Hematology and Oncology", "Plastic Surgery",
          "Pulmonary Medicine", "Radiation Oncology (Radiotherapy)",
          "Surgical Oncology", "Urology",
        ],
      },
      {
        label: "Ancillary Departments",
        departments: [
          "Biostatistics", "History of Medicine", "Medical Education",
          "Medical Ethics", "Students Portal",
        ],
      },
    ],
  },
  {
    institution: "SJRI",
    categories: [
      {
        label: "Divisions",
        departments: [
          "Clinical Research and Training",
          "Epidemiology, Biostatistics and Population Health",
          "Health and Humanities", "Infectious Diseases",
          "Medical Informatics", "Mental Health and Neurosciences",
          "Molecular Medicine", "Nutrition",
        ],
      },
    ],
  },
];

// Flat list for searching across all departments
const ALL_DEPARTMENTS: { dept: string; group: string }[] = DEPARTMENT_GROUPS.flatMap((inst) =>
  inst.categories.flatMap((cat) =>
    cat.departments.map((d) => ({ dept: d, group: `${inst.institution} — ${cat.label}` }))
  )
);

const idTypeOptions = [
  { value: "Student ID", label: "Student ID" },
  { value: "Employee ID", label: "Employee ID" },
  { value: "Aadhar Card", label: "Aadhar Card" },
  { value: "Passport", label: "Passport" },
  { value: "Other", label: "Other" },
];

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

export default function ConsultForm() {
  const [form, setForm] = useState({
    g_name: "",
    profession: "",
    department: "",
    reason: "",
    phone_no: "",
    email: "",
    id_type: "",
    id_number: "",
  });
  const [professionOther, setProfessionOther] = useState("");
  const [reasonOther, setReasonOther] = useState("");
  const [departmentOther, setDepartmentOther] = useState("");
  const [deptSearch, setDeptSearch] = useState("");
  const [deptOpen, setDeptOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PublicUserResult | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<PublicUserResult[]>([]);
  const [userSearching, setUserSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Debounced user search — always searches within STAFF_DEPARTMENT (Biostatistics),
  // independent of the client's own department.
  useEffect(() => {
    if (!userSearch.trim() || selectedUser) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setUserSearching(true);
      try {
        const results = await publicAPI.searchUsers(userSearch, STAFF_DEPARTMENT);
        setUserResults(results);
      } catch {
        // ignore search errors
      } finally {
        setUserSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, selectedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.g_name || !form.profession || !form.department || !form.reason ||
        !form.phone_no || !form.email || !form.id_type || !form.id_number) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.profession === "Other" && !professionOther.trim()) {
      setError("Please describe your profession.");
      return;
    }
    if (form.reason === "Other" && !reasonOther.trim()) {
      setError("Please describe your reason for consultation.");
      return;
    }
    if (form.department === "Others" && !departmentOther.trim()) {
      setError("Please specify your department.");
      return;
    }

    const actualProfession = form.profession === "Other" ? professionOther.trim() : form.profession;
    const actualReason = form.reason === "Other" ? reasonOther.trim() : form.reason;
    const actualDepartment = form.department === "Others" ? departmentOther.trim() : form.department;

    setLoading(true);
    setError("");
    try {
      await publicAPI.submitConsultation({
        ...form,
        profession: actualProfession,
        reason: actualReason,
        department: actualDepartment,
        ...(selectedUser ? { requested_user_id: selectedUser.user_id } : {}),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/10">
              <svg className="h-8 w-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            Request Submitted
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedUser
              ? `Your consultation request has been sent directly to ${selectedUser.username}.`
              : "Your consultation request has been received. A faculty member will be assigned to your session shortly."}
          </p>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Institutional header */}
      <header className="w-full border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="h-1 w-full bg-brand-500" />
        <div className="mx-auto max-w-lg px-4 py-4 text-center">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white/90">
            SJRI Consultations
          </h1>
        </div>
      </header>

      {/* Form body */}
      <div className="flex flex-1 items-start justify-center px-4 py-8">
      {/* QR code (place Consultation QR image in frontend/public/images/consultation-qr.png) */}
      <div className="w-full max-w-lg px-4 mb-4 flex justify-center">
        <img src="/images/consultation-qr.png" alt="Consultation QR code" className="w-36 h-36 object-contain rounded-md shadow-sm" />
      </div>
      <div className="w-full max-w-lg">

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          {error && (
            <div className="mb-4 rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="g_name">
                Full Name <span className="text-error-500">*</span>
              </Label>
              <Input
                id="g_name"
                type="text"
                placeholder="e.g. Dr. Jane Smith"
                value={form.g_name}
                onChange={(e) => setForm((p) => ({ ...p, g_name: e.target.value }))}
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone_no">
                  Phone Number <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="phone_no"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={form.phone_no}
                  onChange={(e) => setForm((p) => ({ ...p, phone_no: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            {/* ID Type + ID Number */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>
                  ID Type <span className="text-error-500">*</span>
                </Label>
                <Select
                  options={idTypeOptions}
                  placeholder="Select ID type"
                  defaultValue={form.id_type}
                  onChange={(v) => setForm((p) => ({ ...p, id_type: v }))}
                />
              </div>
              <div>
                <Label htmlFor="id_number">
                  ID Number <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="id_number"
                  type="text"
                  placeholder="e.g. 2023CS001"
                  value={form.id_number}
                  onChange={(e) => setForm((p) => ({ ...p, id_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Profession */}
              <div className="sm:col-span-1">
                <Label>
                  Profession <span className="text-error-500">*</span>
                </Label>
                <Select
                  options={professionOptions}
                  placeholder="Select profession"
                  defaultValue={form.profession}
                  onChange={(v) => {
                    setForm((p) => ({ ...p, profession: v }));
                    if (v !== "Other") setProfessionOther("");
                  }}
                />
                {form.profession === "Other" && (
                  <textarea
                    rows={2}
                    placeholder="Please specify your profession..."
                    value={professionOther}
                    onChange={(e) => setProfessionOther(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
                  />
                )}
              </div>

              {/* Department — searchable typeahead */}
              <div className="sm:col-span-2">
                <Label>
                  Department <span className="text-error-500">*</span>
                </Label>
                {form.department && form.department !== "Others" ? (
                  <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900">
                    <span className="text-sm text-gray-800 dark:text-white/90">{form.department}</span>
                    <button
                      type="button"
                      onClick={() => { setForm((p) => ({ ...p, department: "" })); setDeptSearch(""); setDepartmentOther(""); }}
                      className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Clear department"
                    >✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search department..."
                      value={deptSearch}
                      onFocus={() => setDeptOpen(true)}
                      onBlur={() => setTimeout(() => setDeptOpen(false), 150)}
                      onChange={(e) => { setDeptSearch(e.target.value); setDeptOpen(true); }}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                    {deptOpen && (() => {
                      const q = deptSearch.toLowerCase();
                      const matched = ALL_DEPARTMENTS.filter((d) => d.dept.toLowerCase().includes(q));
                      // group results by their group label
                      const grouped: Record<string, string[]> = {};
                      matched.forEach(({ dept, group }) => {
                        (grouped[group] ??= []).push(dept);
                      });
                      const showOthers = !q || "others".includes(q);
                      return (
                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                          {Object.entries(grouped).map(([group, depts]) => (
                            <div key={group}>
                              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">{group}</div>
                              {depts.map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onMouseDown={() => {
                                    setForm((p) => ({ ...p, department: d }));
                                    setDeptSearch("");
                                    setDeptOpen(false);
                                    setSelectedUser(null);
                                    setUserSearch("");
                                    setUserResults([]);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          ))}
                          {showOthers && (
                            <button
                              type="button"
                              onMouseDown={() => {
                                setForm((p) => ({ ...p, department: "Others" }));
                                setDeptSearch("");
                                setDeptOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-500 italic hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04]"
                            >
                              Others
                            </button>
                          )}
                          {matched.length === 0 && !showOthers && (
                            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No departments found.</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {form.department === "Others" && (
                  <div className="mt-2 flex items-start gap-2">
                    <textarea
                      rows={2}
                      placeholder="Please specify your department..."
                      value={departmentOther}
                      onChange={(e) => setDepartmentOther(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => { setForm((p) => ({ ...p, department: "" })); setDepartmentOther(""); }}
                      className="mt-1 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Clear"
                    >✕</button>
                  </div>
                )}
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label>
                Reason for Consultation <span className="text-error-500">*</span>
              </Label>
              <Select
                options={reasonOptions}
                placeholder="Select reason"
                defaultValue={form.reason}
                onChange={(v) => {
                  setForm((p) => ({ ...p, reason: v }));
                  if (v !== "Other") setReasonOther("");
                }}
              />
              {form.reason === "Other" && (
                <textarea
                  rows={3}
                  placeholder="Please briefly describe your reason for consultation..."
                  value={reasonOther}
                  onChange={(e) => setReasonOther(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
                />
              )}
            </div>

            {/* Optional: who are you consulting with */}
            <div>
              <Label htmlFor="user_search">
                Who are you consulting with?{" "}
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </Label>

              {selectedUser ? (
                <div className="flex items-center justify-between rounded-lg border border-brand-300 bg-brand-50 px-3 py-2.5 dark:border-brand-500/40 dark:bg-brand-500/10">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {selectedUser.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedUser.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserSearch("");
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Clear selection"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="user_search"
                    type="text"
                    placeholder="Type a name to search..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  {(userSearching || userResults.length > 0 || (userSearch.trim() && !userSearching)) && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                        {userSearching ? (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            Searching...
                          </div>
                        ) : userResults.length > 0 ? (
                          userResults.map((u) => (
                            <button
                              key={u.user_id}
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                            >
                              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {u.username}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {u.role}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No results found.
                          </div>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>

            <Button size="sm" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
