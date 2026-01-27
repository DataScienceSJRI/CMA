// StatCard Component
// Reusable statistics card for displaying metrics

function StatCard({ 
  title, 
  value, 
  icon, 
  trend,
  trendValue,
  color = 'blue',
  className = '' 
}) {
  // Color variants
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    cyan: 'bg-cyan-500'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const trendIcons = {
    up: 'trending_up',
    down: 'trending_down',
    neutral: 'trending_flat'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Content */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {value}
          </p>
          
          {/* Trend Indicator */}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColors[trend]}`}>
              <span className="material-icons text-sm">{trendIcons[trend]}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`${colors[color]} p-4 rounded-full bg-opacity-10`}>
            <span className={`material-icons text-3xl ${colors[color].replace('bg-', 'text-')}`}>
              {icon}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
