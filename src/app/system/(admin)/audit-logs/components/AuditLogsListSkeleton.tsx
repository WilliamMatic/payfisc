export default function AuditLogsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-grow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}