import { useAuth } from "../../context/AuthContext";

export default function UserInfoCard() {
  const { user } = useAuth();

  const fields = [
    { label: "Username", value: user?.username ?? "—" },
    { label: "Role", value: user?.role ?? "—" },
    { label: "Department", value: user?.department ?? "—" },
    {
      label: "Account Status",
      value: user?.is_active ? "Active" : "Inactive",
      highlight: user?.is_active,
    },
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        Account Details
      </h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
        {fields.map(({ label, value, highlight }) => (
          <div key={label}>
            <p className="mb-1 text-xs leading-normal text-gray-500 dark:text-gray-400">
              {label}
            </p>
            <p
              className={`text-sm font-medium ${
                highlight === true
                  ? "text-green-600 dark:text-green-400"
                  : highlight === false
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-800 dark:text-white/90"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
        Role and department are managed by your administrator. Contact your HOD to request changes.
      </p>
    </div>
  );
}
