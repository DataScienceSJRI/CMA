// Card Component
// Reusable card container with consistent styling

function Card({ 
  title, 
  icon,
  children, 
  actions,
  className = '' 
}) {
  return (
    <div className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {icon && <span className="material-icons text-primary">{icon}</span>}
              {title}
            </h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default Card;
