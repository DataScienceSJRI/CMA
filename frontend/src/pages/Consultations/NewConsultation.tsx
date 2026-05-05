import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { consultationAPI, memberAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { ALL_DEPARTMENTS } from "../../constants/departments";
import type { ConsultationFormData, ManagedMember } from "../../types";

export default function NewConsultation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === "HOD" || user?.role === "Faculty";

  const [formData, setFormData] = useState<ConsultationFormData>({
    date: "",
    g_name: "",
    profession: "",
    department: user?.department ?? "",
    reason: "",
    description: "",
    time_spent: "",
    project_from: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Department typeahead state
  const [deptSearch, setDeptSearch] = useState("");
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptOther, setDeptOther] = useState("");

  const [professionOther, setProfessionOther] = useState("");
  const [reasonOther, setReasonOther] = useState("");

  // Managed members for HOD/Faculty assignment
  const [managedMembers, setManagedMembers] = useState<ManagedMember[]>([]);

  useEffect(() => {
    if (isManager) {
      memberAPI
        .getManagedMembers()
        .then(setManagedMembers)
        .catch(() => {});
    }
  }, [isManager]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.profession === "Other" && !professionOther.trim()) {
      setError("Please describe your profession.");
      setLoading(false);
      return;
    }

    if (formData.reason === "Other" && !reasonOther.trim()) {
      setError("Please describe your reason for consultation.");
      setLoading(false);
      return;
    }

    if (formData.department === "Others" && !deptOther.trim()) {
      setError("Please specify your department.");
      setLoading(false);
      return;
    }

    const actualProfession =
      formData.profession === "Other" ? professionOther.trim() : formData.profession;
    const actualReason =
      formData.reason === "Other" ? reasonOther.trim() : formData.reason;
    const actualDepartment =
      formData.department === "Others" ? deptOther.trim() : formData.department;

    try {
      await consultationAPI.createConsultation({
        ...formData,
        profession: actualProfession,
        reason: actualReason,
        department: actualDepartment,
        time_spent: formData.time_spent !== "" ? Number(formData.time_spent) : undefined,
      });
      navigate("/");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      setError(
        axiosErr.response?.data?.detail ??
          axiosErr.response?.data?.message ??
          "Failed to create consultation"
      );
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <PageMeta
        title="New Consultation | CMA"
        description="Create a new consultation entry"
      />
      <PageBreadcrumb pageTitle="New Consultation" />

      <ComponentCard
        title="New Entry Form"
        desc="Log a new consultation session details below."
      >
        {error && (
          <div className="rounded-lg border border-error-300 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Assign To — HOD/Faculty only */}
          {isManager && managedMembers.length > 0 && (
            <div>
              <Label>
                Assign To{" "}
                <span className="text-xs font-normal text-gray-400">
                  (optional — defaults to yourself)
                </span>
              </Label>
              <Select
                options={[
                  { value: "", label: "Myself" },
                  ...managedMembers.map((m) => ({
                    value: m.managed_member_user_id,
                    label: m.member_username || m.managed_member_user_id,
                  })),
                ]}
                placeholder="Select a member"
                defaultValue={formData.assigned_to_user_id ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    assigned_to_user_id: value || undefined,
                  }))
                }
              />
            </div>
          )}

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
                placeholder="e.g. Dr. John Doe"
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
                placeholder="Select a profession"
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, profession: value }));
                  if (value !== "Other") setProfessionOther("");
                }}
                defaultValue={formData.profession}
              />
              {formData.profession === "Other" && (
                <input
                  type="text"
                  placeholder="Please specify your profession..."
                  value={professionOther}
                  onChange={(e) => setProfessionOther(e.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              )}
            </div>

            {/* Department — searchable typeahead */}
            <div className="sm:col-span-2">
              <Label>
                Department <span className="text-error-500">*</span>
              </Label>
              {formData.department && formData.department !== "Others" ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {formData.department}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, department: "" }));
                      setDeptSearch("");
                      setDeptOther("");
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Clear department"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search department..."
                    value={deptSearch}
                    onFocus={() => setDeptOpen(true)}
                    onBlur={() => setTimeout(() => setDeptOpen(false), 150)}
                    onChange={(e) => {
                      setDeptSearch(e.target.value);
                      setDeptOpen(true);
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                  {deptOpen &&
                    (() => {
                      const q = deptSearch.toLowerCase();
                      const matched = ALL_DEPARTMENTS.filter((d) =>
                        d.dept.toLowerCase().includes(q)
                      );
                      const grouped: Record<string, string[]> = {};
                      matched.forEach(({ dept, group }) => {
                        (grouped[group] ??= []).push(dept);
                      });
                      const showOthers = !q || "others".includes(q);
                      return (
                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                          {Object.entries(grouped).map(([group, depts]) => (
                            <div key={group}>
                              <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-400 dark:bg-gray-800/50 dark:text-gray-500">
                                {group}
                              </div>
                              {depts.map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onMouseDown={() => {
                                    setFormData((p) => ({ ...p, department: d }));
                                    setDeptSearch("");
                                    setDeptOpen(false);
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
                                setFormData((p) => ({ ...p, department: "Others" }));
                                setDeptSearch("");
                                setDeptOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm italic text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04]"
                            >
                              Others
                            </button>
                          )}
                          {matched.length === 0 && !showOthers && (
                            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                              No departments found.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
              )}
              {formData.department === "Others" && (
                <div className="mt-2 flex items-start gap-2">
                  <input
                    type="text"
                    placeholder="Please specify your department..."
                    value={deptOther}
                    onChange={(e) => setDeptOther(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, department: "" }));
                      setDeptOther("");
                    }}
                    className="mt-2.5 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Clear"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div>
              <Label>
                Reason <span className="text-error-500">*</span>
              </Label>
              <Select
                options={reasonOptions}
                placeholder="Select a reason"
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, reason: value }));
                  if (value !== "Other") setReasonOther("");
                }}
                defaultValue={formData.reason}
              />
              {formData.reason === "Other" && (
                <input
                  type="text"
                  placeholder="Please specify your reason..."
                  value={reasonOther}
                  onChange={(e) => setReasonOther(e.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              )}
            </div>

            <div>
              <Label htmlFor="time_spent">Time Spent (minutes)</Label>
              <Input
                type="text"
                id="time_spent"
                name="time_spent"
                placeholder="e.g. 60"
                value={formData.time_spent}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="project_from">
                Project From <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                id="project_from"
                name="project_from"
                placeholder="e.g. Research Grant XYZ"
                value={formData.project_from}
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
              placeholder="Brief description of the consultation..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>
            <Button size="sm" disabled={loading}>
              {loading ? "Submitting..." : "Submit Entry"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
