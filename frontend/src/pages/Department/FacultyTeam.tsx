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
import type { ManagedMember } from "../../types";

export default function FacultyTeam() {
  const { deptName, facultyId } = useParams<{
    deptName: string;
    facultyId: string;
  }>();
  const navigate = useNavigate();

  const [members, setMembers] = useState<ManagedMember[]>([]);
  const [loading, setLoading] = useState(true);

  const department = deptName ? decodeURIComponent(deptName) : "";

  // Derive faculty name from first member's manager_username field, or fall back to the ID
  const facultyName =
    members[0]?.manager_username || `Faculty ${facultyId?.slice(0, 8)}`;

  useEffect(() => {
    if (!facultyId) return;
    userAPI
      .getFacultyManagedMembers(facultyId)
      .then(setMembers)
      .catch((err) => console.error("Failed to load team members:", err))
      .finally(() => setLoading(false));
  }, [facultyId]);

  if (loading) return <LoadingSpinner message="Loading team members..." />;

  return (
    <>
      <PageMeta
        title={`${facultyName}'s Team | CMA`}
        description={`Team members managed by ${facultyName}`}
      />
      <PageBreadcrumb
        pageTitle={`${facultyName}'s Team`}
        breadcrumb={[
          { label: "Department Overview", href: "/department" },
          {
            label: department,
            href: `/department/${encodeURIComponent(department)}`,
          },
        ]}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {members.length} {members.length === 1 ? "member" : "members"} on this team
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/department/${encodeURIComponent(department)}`)
            }
          >
            ← Back
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Team Members
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
                    Member
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Role
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
                {members.map((member) => (
                  <TableRow
                    key={member.managed_id}
                    className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                          {(member.member_username || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {member.member_username || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-6 py-4">
                      <Badge
                        size="sm"
                        color={
                          member.member_role === "HOD"
                            ? "primary"
                            : member.member_role === "Faculty"
                            ? "info"
                            : "light"
                        }
                      >
                        {member.member_role || "Member"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          navigate(`/member/${member.managed_member_user_id}`)
                        }
                        className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        View Activity
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      This faculty has no team members yet.
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
