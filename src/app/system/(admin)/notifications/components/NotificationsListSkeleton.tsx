// app/notifications/components/NotificationsListSkeleton.tsx
export default function NotificationsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-grow">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-2/3"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}