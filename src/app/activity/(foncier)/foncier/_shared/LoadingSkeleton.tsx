"use client";
export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl mt-6" />
    </div>
  );
}
