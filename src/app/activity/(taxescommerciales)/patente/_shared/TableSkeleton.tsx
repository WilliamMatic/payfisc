function TableSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40" />
      </div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-12 bg-gray-50 dark:bg-gray-900/50" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 border-t border-gray-100 dark:border-gray-700" />
        ))}
      </div>
    </div>
  );
}
export default TableSkeleton;
