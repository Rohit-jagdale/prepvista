'use client';

interface LogoSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LogoSpinner({ size = 'md', text = 'Loading...' }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="text-center">
      <div className={`${sizeClasses[size]} mx-auto mb-4 relative`}>
        <img 
          src="/assets/images/PrepVista_favicon.png" 
          alt="PrepVista Logo" 
          className={`${sizeClasses[size]} rounded-lg animate-pulse`}
        />
        <div className="absolute inset-0 border-2 border-primary-600 border-t-transparent rounded-lg animate-spin"></div>
      </div>
      {text && (
        <p className={`${textSizes[size]} text-gray-600 dark:text-gray-400`}>{text}</p>
      )}
    </div>
  );
}
