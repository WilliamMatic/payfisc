export default function RefactorAuditSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-5 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-80 bg-gray-200 rounded mt-2 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xl border border-gray-200 p-4 h-20 animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 h-96 animate-pulse" />
      </div>
    </div>
  );
}
