// Page Header Component
// Reusable header with title and optional actions

function PageHeader({ 
  title, 
  subtitle, 
  actions,
  breadcrumbs 
}) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav className="flex items-center gap-2 text-sm mb-4">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {idx > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="text-primary hover:text-primary-hover transition-colors font-medium"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-gray-900 dark:text-white font-medium">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
