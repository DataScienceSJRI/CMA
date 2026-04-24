import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { consultationAPI } from "../../services/api";
import type { ConflictNotification } from "../../types";
import { useAuth } from "../../context/AuthContext";

type NotifType = "pending" | "assigned" | "completed" | "conflict";

interface NotifItem {
  id: string;
  type: NotifType;
  title: string;
  subtitle: string;
  time: string;
  path: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isHODOrFaculty = user?.role === "HOD" || user?.role === "Faculty";

  useEffect(() => {
    loadNotifications();
  }, [user?.user_id]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const notifs: NotifItem[] = [];
    try {
      // 1. Pending QR consultations awaiting assignment (HOD / Faculty only)
      if (isHODOrFaculty) {
        const pending = await consultationAPI.getPendingConsultations();
        pending.forEach((p) => {
          notifs.push({
            id: `pending-${p.consultation_id}`,
            type: "pending",
            title: p.g_name,
            subtitle: `${p.department} · ${p.reason}`,
            time: timeAgo(p.created_at),
            path: "/",
          });
        });
      }

      // 2. Conflict notifications — same person (id + profession + department) with multiple staff
      const conflicts: ConflictNotification[] = await consultationAPI.getConflictNotifications();
      conflicts.forEach((c) => {
        notifs.push({
          id: `conflict-${c.consultation_id}`,
          type: "conflict",
          title: c.g_name,
          subtitle: `Also with ${c.other_username} · ${c.profession} · ${c.department}`,
          time: timeAgo(c.created_at),
          path: `/consultation/${c.consultation_id}/edit`,
        });
      });

      // 3. Personal consultations created / assigned in the last 7 days
      const personal = await consultationAPI.getPersonalConsultations();
      const cutoff = Date.now() - SEVEN_DAYS;
      personal
        .filter((c) => new Date(c.created_at).getTime() > cutoff)
        .forEach((c) => {
          notifs.push({
            id: `personal-${c.consultation_id}`,
            type: c.status === "Completed" ? "completed" : "assigned",
            title: c.g_name,
            subtitle: `${c.department} · ${c.reason}`,
            time: timeAgo(c.created_at),
            path: `/consultation/${c.consultation_id}/edit`,
          });
        });

      setItems(notifs);
    } catch {
      // silently ignore — notifications are non-critical
    } finally {
      setLoading(false);
    }
  };

  const iconForType = (type: NotifType) => {
    if (type === "pending") {
      return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-500/10">
          <svg className="h-4 w-4 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    }
    if (type === "completed") {
      return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
          <svg className="h-4 w-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    }
    if (type === "conflict") {
      return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/10">
          <svg className="h-4 w-4 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </span>
      );
    }
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
        <svg className="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </span>
    );
  };

  const labelForType = (type: NotifType) => {
    if (type === "pending") return "Awaiting assignment";
    if (type === "completed") return "Completed";
    if (type === "conflict") return "Conflict detected";
    return "Assigned to you";
  };

  const badgeClass = (type: NotifType) => {
    if (type === "pending")
      return "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400";
    if (type === "completed")
      return "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400";
    if (type === "conflict")
      return "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400";
    return "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400";
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {!loading && items.length > 0 && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping" />
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            {!loading && items.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-medium text-white">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <ul className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
              Loading...
            </li>
          ) : items.length === 0 ? (
            <li className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <svg
                className="h-10 w-10 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">You're all caught up</p>
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <DropdownItem
                  tag="a"
                  to={item.path}
                  onItemClick={() => setIsOpen(false)}
                  baseClassName=""
                  className="flex items-start gap-3 rounded-lg border-b border-gray-100 px-3 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  {iconForType(item.type)}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {item.time}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                      {item.subtitle}
                    </span>
                    <span
                      className={`mt-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${badgeClass(item.type)}`}
                    >
                      {labelForType(item.type)}
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>

        {/* Footer */}
        <DropdownItem
          tag="a"
          to="/consultations"
          onItemClick={() => setIsOpen(false)}
          baseClassName=""
          className="mt-3 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View All Consultations
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
