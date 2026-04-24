interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  /** Optional subtitle shown below the value */
  sub?: string;
  /** Optional Tailwind classes for the icon container background + text color */
  accent?: string;
  trend?: { value: string; isPositive: boolean };
}

export default function StatCard({ title, value, icon, sub, accent, trend }: StatCardProps) {
  const iconClass = accent
    ? `flex h-12 w-12 items-center justify-center rounded-xl ${accent}`
    : "flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
          )}
          {trend && (
            <p
              className={`mt-1 text-sm font-medium ${
                trend.isPositive
                  ? "text-success-600 dark:text-success-500"
                  : "text-error-600 dark:text-error-500"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}
            </p>
          )}
        </div>
        <div className={iconClass}>
          {icon}
        </div>
      </div>
    </div>
  );
}
