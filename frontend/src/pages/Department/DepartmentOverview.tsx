import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import LoadingSpinner from "../../components/cma/LoadingSpinner";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { userAPI, authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { FacultyUser, ManagedMember } from "../../types";

export default function DepartmentOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userIsHOD = user?.role?.toLowerCase() === "hod";
  const department = user?.department ?? "";

  const [faculties, setFaculties] = useState<FacultyUser[]>([]);
  const [myTeam, setMyTeam] = useState<ManagedMember[]>([]);
  const [hodTeam, setHodTeam] = useState<ManagedMember[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Add Faculty modal ─────────────────────────────────────────────────────
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addFacultyError, setAddFacultyError] = useState("");
  const [addFacultyLoading, setAddFacultyLoading] = useState(false);

  // ── Add Member modal ──────────────────────────────────────────────────────
  const [targetFaculty, setTargetFaculty] = useState<FacultyUser | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<FacultyUser[]>([]);
  const [selectedMember, setSelectedMember] = useState<FacultyUser | null>(null);
  const [memberType, setMemberType] = useState("");
  const [memberSearching, setMemberSearching] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  const loadFaculties = () => {
    if (!department) return;
    setLoading(true);
    if (userIsHOD) {
      Promise.all([
        userAPI.getFacultyByDepartment(department),
        userAPI.getFacultyManagedMembers(user!.user_id),
      ])
        .then(([fetchedFaculties, fetchedHodTeam]) => {
          setFaculties(fetchedFaculties);
          setHodTeam(fetchedHodTeam);
        })
        .catch((err) => console.error("Failed to load department data:", err))
        .finally(() => setLoading(false));
    } else {
      userAPI
        .getFacultyManagedMembers(user!.user_id)
        .then(setMyTeam)
        .catch((err) => console.error("Failed to load team:", err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadFaculties();
  }, [department]);

  // Debounced user search for "Add Member" modal
  useEffect(() => {
    if (!memberSearch.trim() || selectedMember) {
      setMemberResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const results = await userAPI.searchUsers(memberSearch);
        setMemberResults(results);
      } catch {
        // ignore
      } finally {
        setMemberSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch, selectedMember]);

  // ── Add Faculty handlers ──────────────────────────────────────────────────

  const resetAddFaculty = () => {
    setNewUsername("");
    setNewPassword("");
    setAddFacultyError("");
  };

  const handleAddFaculty = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setAddFacultyError("Username and password are required.");
      return;
    }
    setAddFacultyLoading(true);
    setAddFacultyError("");
    try {
      await authAPI.register({
        username: newUsername.trim(),
        password: newPassword.trim(),
        role: "Faculty",
        department,
      });
      resetAddFaculty();
      setShowAddFaculty(false);
      loadFaculties();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to add faculty.";
      setAddFacultyError(msg);
    } finally {
      setAddFacultyLoading(false);
    }
  };

  // ── Add Member handlers ───────────────────────────────────────────────────

  const resetAddMember = () => {
    setMemberSearch("");
    setMemberResults([]);
    setSelectedMember(null);
    setMemberType("");
    setAddMemberError("");
    setTargetFaculty(null);
  };

  const handleAddMember = async () => {
    if (!selectedMember || !targetFaculty) return;
    setAddMemberLoading(true);
    setAddMemberError("");
    try {
      await userAPI.addFacultyManagedMember(targetFaculty.user_id, {
        managed_member_user_id: selectedMember.user_id,
        ...(memberType.trim() ? { member_type: memberType.trim() } : {}),
      });
      resetAddMember();
      loadFaculties(); // refresh team/faculty list after adding
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to add member.";
      setAddMemberError(msg);
    } finally {
      setAddMemberLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading faculty members..." />;

  return (
    <>
      <PageMeta
        title="Department Overview | CMA"
        description="Faculty members in the department"
      />
      <PageBreadcrumb pageTitle="Department Overview" />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                {userIsHOD ? "Faculty Members" : "My Team"}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {department}
              </p>
            </div>
            {userIsHOD ? (
              <Button size="sm" onClick={() => setShowAddFaculty(true)}>
                + Add Faculty
              </Button>
            ) : (
              <Button size="sm" onClick={() => setTargetFaculty(user as FacultyUser)}>
                + Add Member
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            {userIsHOD ? (
              /* ── HOD view: list of all faculty ─────────────────── */
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 dark:border-gray-800">
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Faculty
                    </TableCell>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculties.map((faculty) => (
                    <TableRow key={faculty.user_id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <TableCell className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                            {faculty.username.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">{faculty.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4">
                        <Badge size="sm" color={faculty.is_active ? "success" : "light"}>
                          {faculty.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => setTargetFaculty(faculty)}
                            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >
                            + Add Member
                          </button>
                          <button
                            onClick={() => navigate(`/department/${encodeURIComponent(department)}/faculty/${faculty.user_id}`)}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                        No faculty members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              /* ── Faculty view: their own team members only ─────── */
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 dark:border-gray-800">
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Member
                    </TableCell>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Role
                    </TableCell>
                    <TableCell isHeader className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTeam.map((member) => (
                    <TableRow key={member.managed_id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <TableCell className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                            {(member.member_username || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {member.member_username || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4">
                        <Badge size="sm" color={member.member_role === "Faculty" ? "info" : "light"}>
                          {member.member_role || "Member"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/member/${member.managed_member_user_id}`)}
                          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >
                          View Consultations →
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {myTeam.length === 0 && (
                    <TableRow>
                      <TableCell className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No team members assigned yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* ── HOD's direct team ─────────────────────────────────────────── */}
        {userIsHOD && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-base font-medium text-gray-800 dark:text-white/90">My Direct Team</h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Members managed directly by you</p>
              </div>
              <Button size="sm" onClick={() => setTargetFaculty(user as FacultyUser)}>
                + Add Member
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 dark:border-gray-800">
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Member</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hodTeam.map((member) => (
                    <TableRow key={member.managed_id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                      <TableCell className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                            {(member.member_username || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{member.member_username || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4">
                        <Badge size="sm" color="light">{member.member_role || "Member"}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/member/${member.managed_member_user_id}`)}
                          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >
                          View Consultations →
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {hodTeam.length === 0 && (
                    <TableRow>
                      <TableCell className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No direct team members yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Faculty Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddFaculty}
        onClose={() => {
          resetAddFaculty();
          setShowAddFaculty(false);
        }}
        className="max-w-md p-6"
      >
        <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Add Faculty
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="new_username">Username</Label>
            <Input
              id="new_username"
              type="text"
              placeholder="Enter username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new_password">Password</Label>
            <Input
              id="new_password"
              type="password"
              placeholder="Enter password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Role: <span className="font-medium">Faculty</span> &nbsp;·&nbsp;
            Department: <span className="font-medium">{department}</span>
          </div>

          {addFacultyError && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {addFacultyError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetAddFaculty();
                setShowAddFaculty(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddFaculty}
              disabled={addFacultyLoading}
            >
              {addFacultyLoading ? "Adding..." : "Add Faculty"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Member Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!targetFaculty}
        onClose={resetAddMember}
        className="max-w-md p-6"
      >
        <h3 className="mb-1 text-lg font-medium text-gray-800 dark:text-white/90">
          Add Member
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          to{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {targetFaculty?.username}
          </span>
          's team
        </p>
        <div className="space-y-4">
          {/* User search */}
          <div>
            <Label htmlFor="member_search">Member Name</Label>
            {selectedMember ? (
              <div className="flex items-center justify-between rounded-lg border border-brand-300 bg-brand-50 px-3 py-2.5 dark:border-brand-500/40 dark:bg-brand-500/10">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {selectedMember.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedMember.role}
                    {selectedMember.department
                      ? ` · ${selectedMember.department}`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedMember(null);
                    setMemberSearch("");
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
                  id="member_search"
                  type="text"
                  placeholder="Type a name to search..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
                {(memberSearching ||
                  memberResults.length > 0 ||
                  (memberSearch.trim() && !memberSearching)) && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {memberSearching ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        Searching...
                      </div>
                    ) : memberResults.length > 0 ? (
                      memberResults.map((u) => (
                        <button
                          key={u.user_id}
                          onClick={() => setSelectedMember(u)}
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
                        No users found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Member type */}
          <div>
            <Label htmlFor="member_type">
              Member Type{" "}
              <span className="text-xs font-normal text-gray-400">
                (optional)
              </span>
            </Label>
            <Input
              id="member_type"
              type="text"
              placeholder="e.g. Research Assistant, Project Member"
              value={memberType}
              onChange={(e) => setMemberType(e.target.value)}
            />
          </div>

          {addMemberError && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {addMemberError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={resetAddMember}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddMember}
              disabled={!selectedMember || addMemberLoading}
            >
              {addMemberLoading ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
