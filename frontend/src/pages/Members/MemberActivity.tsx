import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ConsultationBarChart from "../../components/cma/ConsultationBarChart";
import ConsultationTable from "../../components/cma/ConsultationTable";
import InvoiceModal from "../../components/cma/InvoiceModal";
import Button from "../../components/ui/button/Button";
import { consultationAPI, userAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { Consultation } from "../../types";

export default function MemberActivity() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canInvoice = user?.role === "HOD" || user?.role === "Faculty";

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceTarget, setInvoiceTarget] = useState<Consultation | null>(null);
  const [memberUsername, setMemberUsername] = useState<string>("");

  useEffect(() => {
    if (memberId) {
      loadMemberConsultations();
      userAPI.getUserProfile(memberId)
        .then((profile) => setMemberUsername(profile.username))
        .catch(() => {});
    }
  }, [memberId]);

  const loadMemberConsultations = async () => {
    try {
      setLoading(true);
      const data = await consultationAPI.getMemberConsultations(memberId!);
      setConsultations(data);
    } catch (err) {
      console.error("Failed to load member consultations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalConsultations = consultations.length;
  const completedCount = consultations.filter(
    (c) => c.status === "Completed"
  ).length;

  // Monthly chart data
  const monthlyMap: Record<string, number> = {};
  consultations.forEach((c) => {
    const month = new Date(c.date).toLocaleString("default", {
      month: "short",
    });
    monthlyMap[month] = (monthlyMap[month] || 0) + 1;
  });
  const months = Object.keys(monthlyMap);
  const counts = Object.values(monthlyMap);

  const memberName = memberUsername || consultations[0]?.responsible_username || "Member";

  return (
    <>
      <PageMeta
        title="Member Activity | CMA"
        description="Member activity detail"
      />
      <PageBreadcrumb pageTitle="Member Activity" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">
              {memberName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Consultation tracking detail
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button size="sm" onClick={() => navigate("/new-consultation")}>
              + New Consultation
            </Button>
          </div>
        </div>

        {/* Stats + Chart */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Member Stats Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
              Member Profile
            </h3>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                {memberName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {memberName}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div>
                <p className="text-2xl font-bold text-brand-500">
                  {totalConsultations}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success-500">
                  {completedCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Completed
                </p>
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="lg:col-span-2">
            {months.length > 0 ? (
              <ConsultationBarChart
                categories={months}
                data={counts}
                title="Monthly Activity"
                height={250}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No activity data available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Consultation History Table */}
        <ConsultationTable
          consultations={consultations}
          loading={loading}
          showActions={canInvoice}
          onInvoice={canInvoice ? (c) => setInvoiceTarget(c) : undefined}
        />
      </div>

      <InvoiceModal
        consultation={invoiceTarget}
        onClose={() => setInvoiceTarget(null)}
      />
    </>
  );
}
