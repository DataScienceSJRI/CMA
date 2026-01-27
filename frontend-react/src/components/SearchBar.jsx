// SearchBar Component
// Reusable search input field

function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  className = '' 
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 material-icons text-gray-400">
        search
      </span>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <span className="material-icons text-xl">close</span>
        </button>
      )}
    </div>
  );
}

export default SearchBar;
