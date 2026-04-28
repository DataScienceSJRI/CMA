import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import LoadingSpinner from "../../components/cma/LoadingSpinner";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { userAPI } from "../../services/api";
import { displayName as getDisplayName } from "../../utils/displayName";
import type { FacultyUser } from "../../types";

export default function DepartmentFaculties() {
  const { deptName } = useParams<{ deptName: string }>();
  const navigate = useNavigate();

  const [faculties, setFaculties] = useState<FacultyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const department = deptName ? decodeURIComponent(deptName) : "";

  useEffect(() => {
    if (!department) return;
    userAPI
      .getFacultyByDepartment(department)
      .then(setFaculties)
      .catch((err) => console.error("Failed to load faculties:", err))
      .finally(() => setLoading(false));
  }, [department]);

  if (loading) return <LoadingSpinner message="Loading faculties..." />;

  return (
    <>
      <PageMeta
        title={`${department} | CMA`}
        description={`Faculty list for ${department}`}
      />
      <PageBreadcrumb
        pageTitle={department}
        breadcrumb={[{ label: "Department Overview", href: "/department" }]}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {faculties.length}{" "}
            {faculties.length === 1 ? "faculty" : "faculties"} in this
            department
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/department")}
          >
            ← Back
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Faculty Members
            </h3>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 dark:border-gray-800">
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Faculty
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculties.map((faculty) => (
                  <TableRow
                    key={faculty.user_id}
                    className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    {/* Profile icon + name */}
                    <TableCell className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                          {getDisplayName(faculty).charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {getDisplayName(faculty)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {department}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Active / Inactive badge */}
                    <TableCell className="whitespace-nowrap px-6 py-4">
                      <Badge
                        size="sm"
                        color={faculty.is_active ? "success" : "light"}
                      >
                        {faculty.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => navigate(`/member/${faculty.user_id}`)}
                          className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          View Consultations
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/department/${encodeURIComponent(department)}/faculty/${faculty.user_id}`
                            )
                          }
                          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >
                          View Team →
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {faculties.length === 0 && (
                  <TableRow>
                    <TableCell className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No faculty members found in {department}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
