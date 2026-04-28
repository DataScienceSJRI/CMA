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
    time_spent: 0,
    project_from: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await consultationAPI.createConsultation(formData);
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
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, profession: value }))
                }
                defaultValue={formData.profession}
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                disabled
              />
            </div>

            <div>
              <Label>
                Reason <span className="text-error-500">*</span>
              </Label>
              <Select
                options={reasonOptions}
                placeholder="Select a reason"
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, reason: value }))
                }
                defaultValue={formData.reason}
              />
            </div>

            <div>
              <Label htmlFor="time_spent">
                Time Spent (minutes) <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                id="time_spent"
                name="time_spent"
                min="0"
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
