// EmptyState Component
// Reusable empty state placeholder

function EmptyState({ 
  icon = 'inbox', 
  title, 
  description, 
  action,
  actionLabel,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      {/* Icon */}
      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full mb-4">
        <span className="material-icons text-5xl text-gray-400 dark:text-gray-500">
          {icon}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
