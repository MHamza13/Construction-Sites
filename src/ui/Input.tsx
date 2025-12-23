// components/ui/Input.jsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = ({ 
  id, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  icon, 
  trailingIcon, 
  className, 
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          className={twMerge(
            clsx(
              'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3',
              {
                'pl-10': icon,
                'pr-10': trailingIcon,
                'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': error,
                'pl-3': !icon
              }
            )
          )}
          {...props}
        />
        
        {trailingIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {trailingIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;