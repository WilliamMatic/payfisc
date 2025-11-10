export default function AuditStatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
        </div>
      ))}
    </div>
  );
}