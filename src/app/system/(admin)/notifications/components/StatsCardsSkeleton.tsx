// app/notifications/components/StatsCardsSkeleton.tsx
export default function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}