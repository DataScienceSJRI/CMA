// FormInput Component
// Reusable form input field with label and validation

function FormInput({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required = false,
  error,
  disabled = false,
  rows,
  options, // For select dropdowns
  className = ''
}) {
  const baseInputStyles = `
    w-full px-4 py-2 
    bg-gray-50 dark:bg-gray-700 
    border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
    rounded-lg 
    text-gray-700 dark:text-gray-200
    focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-primary'}
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows || 4}
          className={baseInputStyles}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={baseInputStyles}
        >
          <option value="">{placeholder || 'Select an option'}</option>
          {options && options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputStyles}
        />
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
          <span className="material-icons text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

export default FormInput;
