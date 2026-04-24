import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { consultationAPI, memberAPI, userAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { PendingConsultation, Consultation, FacultyUser, ManagedMember } from "../../types";

// Minimal shape needed — satisfied by both Consultation and PendingConsultation
type AssignTarget = Pick<PendingConsultation, "consultation_id" | "g_name" | "reason"> | Pick<Consultation, "consultation_id" | "g_name" | "reason">;

interface AssignModalProps {
  consultation: AssignTarget | null;
  onClose: () => void;
  onAssigned: (consultationId: string) => void;
  isPending?: boolean;
}

export default function AssignModal({ consultation, onClose, onAssigned, isPending = false }: AssignModalProps) {
  const { user } = useAuth();
  const isHOD = user?.role === "HOD";

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<(FacultyUser | ManagedMember)[]>([]);
  const [selected, setSelected] = useState<{ user_id: string; username: string; role?: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load assignable users
  useEffect(() => {
    if (!consultation) return;
    setSearch("");
    setSelected(null);
    setResults([]);
    setError("");

    if (!isHOD) {
      // Faculty: load their managed members directly (no search needed)
      memberAPI.getManagedMembers().then((members) => {
        const mapped = members.map((m) => ({
          user_id: m.managed_member_user_id,
          username: m.member_username || m.managed_member_user_id,
          role: m.member_role,
        }));
        setResults(mapped as FacultyUser[]);
      }).catch(() => {});
    }
  }, [consultation, isHOD]);

  // HOD: debounced search within their department
  useEffect(() => {
    if (!isHOD || !search.trim() || selected) {
      if (isHOD) setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // HOD searches all users — userAPI.searchUsers already scopes to active users
        const found = await userAPI.searchUsers(search);
        setResults(found);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selected, isHOD]);

  const handleAssign = async () => {
    if (!consultation || !selected) return;
    setLoading(true);
    setError("");
    try {
      await consultationAPI.assignConsultation(consultation.consultation_id, selected.user_id);
      onAssigned(consultation.consultation_id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? "Failed to assign consultation.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearch("");
    setSelected(null);
    setResults([]);
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={!!consultation} onClose={handleClose} className="max-w-md p-6">
      <h3 className="mb-1 text-lg font-medium text-gray-800 dark:text-white/90">
        Assign Consultation
      </h3>
      {consultation && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {consultation.g_name}
          </span>{" "}
          · {consultation.reason}
        </p>
      )}

      <div className="space-y-4">
        {/* Self-assign shortcut — HOD: pending only; Faculty: always */}
        {(isPending || !isHOD) && !selected && (
          <button
            type="button"
            onClick={() =>
              setSelected({
                user_id: user!.user_id,
                username: user!.username,
                role: user!.role,
              })
            }
            className="flex w-full items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-left hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
              <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                Assign to myself
              </p>
              <p className="text-xs text-brand-500 dark:text-brand-400">
                {user!.username} · {user!.role}
              </p>
            </div>
          </button>
        )}

        {/* Chip shown when Faculty selected themselves (HOD's section renders its own chip) */}
        {!isHOD && selected && selected.user_id === user?.user_id && (
          <div className="flex items-center justify-between rounded-lg border border-brand-300 bg-brand-50 px-3 py-2.5 dark:border-brand-500/40 dark:bg-brand-500/10">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {selected.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selected.role}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>
        )}

        {/* Divider shown when self-assign button is visible */}
        {(isPending || !isHOD) && !selected && (
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500">or assign to someone else</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>
        )}

        {isHOD ? (
          // HOD: search input
          <div>
            <Label htmlFor="assign_search">Assign to</Label>
            {selected ? (
              <div className="flex items-center justify-between rounded-lg border border-brand-300 bg-brand-50 px-3 py-2.5 dark:border-brand-500/40 dark:bg-brand-500/10">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {selected.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selected.role}
                  </p>
                </div>
                <button
                  onClick={() => { setSelected(null); setSearch(""); }}
                  className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear selection"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="assign_search"
                  type="text"
                  placeholder="Search faculty or member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {(searching || results.length > 0 || (search.trim() && !searching)) && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {searching ? (
                      <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                    ) : results.length > 0 ? (
                      results.map((u) => (
                        <button
                          key={(u as FacultyUser).user_id}
                          onClick={() => setSelected({
                            user_id: (u as FacultyUser).user_id,
                            username: (u as FacultyUser).username,
                            role: (u as FacultyUser).role,
                          })}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        >
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {(u as FacultyUser).username}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(u as FacultyUser).role}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No users found.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Faculty: pick from managed members list
          <div>
            <Label>Assign to a team member</Label>
            <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  No managed members found.
                </p>
              ) : (
                results.map((u) => {
                  const uid = (u as FacultyUser).user_id;
                  const uname = (u as FacultyUser).username;
                  const urole = (u as FacultyUser).role;
                  const isSelected = selected?.user_id === uid;
                  return (
                    <button
                      key={uid}
                      onClick={() => setSelected({ user_id: uid, username: uname, role: urole })}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {uname}
                      </span>
                      {isSelected && (
                        <span className="text-xs text-brand-500">Selected</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-error-500 dark:text-error-400">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={!selected || loading}
          >
            {loading ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
