import GlobalLoading from '@/components/GlobalLoading';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <GlobalLoading text="Loading PrepVista..." size="lg" fullScreen={true} />
    </div>
  );
}
