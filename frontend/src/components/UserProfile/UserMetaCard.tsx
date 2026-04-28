import { useAuth } from "../../context/AuthContext";
import { displayName as getDisplayName, initials as getInitials } from "../../utils/displayName";

export default function UserMetaCard() {
  const { user } = useAuth();

  const displayName = getDisplayName(user) || "User";
  const initials = getInitials(user);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col items-center gap-5 xl:flex-row xl:items-center">
        {/* Avatar */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-2xl font-semibold">
          {initials}
        </div>

        {/* Name + role + department */}
        <div>
          <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90 capitalize">
            {displayName}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="capitalize">{user?.role ?? ""}</span>
            {user?.department && (
              <>
                <span className="h-3.5 w-px bg-gray-300 dark:bg-gray-700" />
                <span>{user.department}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
