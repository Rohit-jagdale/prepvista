'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showSubtitle?: boolean;
  linkTo?: string;
  className?: string;
}

export default function Logo({ 
  size = 'md', 
  showText = true, 
  showSubtitle = true, 
  linkTo = '/',
  className = ''
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const subtitleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const LogoContent = () => (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} bg-primary-600 rounded-lg flex items-center justify-center`}>
        <img 
          src="/assets/images/PrepVista_favicon.png" 
          alt="PrepVista Logo" 
          className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} rounded`}
        />
      </div>
      {showText && (
        <div>
          <h1 className={`${textSizes[size]} font-bold text-gray-900 dark:text-white`}>
            PrepVista
          </h1>
          {showSubtitle && (
            <p className={`${subtitleSizes[size]} text-gray-600 dark:text-gray-400`}>
              AI-Powered Learning Platform
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="hover:opacity-80 transition-opacity">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}
