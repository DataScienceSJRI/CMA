// Bar Chart Component
// Reusable bar chart for displaying monthly/categorical data

function BarChart({ 
  data, 
  height = 'h-64',
  showValues = true,
  colorClass = 'bg-primary' 
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No data to display
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(item => item.count || item.value || 0));

  return (
    <div className={`${height} flex items-end justify-between space-x-2 px-4 pb-2 border-b border-gray-200 dark:border-gray-600`}>
      {data.map((item, index) => {
        const value = item.count || item.value || 0;
        const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const customColor = item.color || colorClass;

        return (
          <div
            key={item.id || item.label || index}
            className="group flex flex-col items-center flex-1 h-full justify-end cursor-pointer"
          >
            {/* Value label (shown on hover or always if showValues) */}
            {showValues && (
              <span className={`text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ${
                showValues === 'hover' ? 'opacity-0 group-hover:opacity-100' : ''
              } transition-opacity`}>
                {value}
              </span>
            )}

            {/* Bar */}
            <div
              className={`w-full ${customColor} hover:opacity-80 rounded-t transition-all duration-300`}
              style={{ height: `${heightPercent}%` }}
              title={`${item.label || item.month || item.category}: ${value}`}
            ></div>

            {/* Label */}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 text-center">
              {item.label || item.month || item.category}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default BarChart;
