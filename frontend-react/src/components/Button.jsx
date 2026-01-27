// Button Component
// Reusable button with variants and sizes

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  onClick,
  type = 'button',
  disabled = false,
  className = ''
}) {
  // Variant styles
  const variants = {
    primary: 'bg-primary hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white dark:border-blue-400 dark:text-blue-400',
    ghost: 'text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400'
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const baseStyles = 'rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && <span className="material-icons text-xl">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
