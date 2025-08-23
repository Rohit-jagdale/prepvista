'use client';

import LogoSpinner from './LogoSpinner';

interface GlobalLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function GlobalLoading({ 
  text = 'Loading...', 
  size = 'md', 
  fullScreen = false 
}: GlobalLoadingProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <LogoSpinner size={size} text={text} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <LogoSpinner size={size} text={text} />
    </div>
  );
}
