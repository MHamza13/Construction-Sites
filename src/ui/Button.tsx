// components/ui/Button.jsx
import { LoaderCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({ 
  children, 
  loading = false, 
  loadingText = 'Loading...', 
  className, 
  ...props 
}) => {
  return (
    <button
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle className="animate-spin -ml-1 mr-2 h-4 w-4" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;