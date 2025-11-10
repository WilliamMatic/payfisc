"use client";

interface AuditLog {
  id: number;
  user_id: string;
  user_type: string;
  action: string;
  timestamp: string;
}

interface AuditLogsListProps {
  auditLogs: AuditLog[];
  getUserTypeEmoji: (userType: string) => string;
  getUserTypeColor: (userType: string) => string;
  formatDate: (dateString: string) => string;
  formatFullDate: (dateString: string) => string;
}

export default function AuditLogsList({ 
  auditLogs, 
  getUserTypeEmoji, 
  getUserTypeColor,
  formatDate,
  formatFullDate 
}: AuditLogsListProps) {
  if (auditLogs.length === 0) {
    return (
      <div className="text-center bg-white rounded-xl p-12 shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Aucune activité trouvée
        </h3>
        <p className="text-gray-600">
          Aucune activité ne correspond à vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {auditLogs.map((log) => (
        <div 
          key={log.id} 
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start gap-4">
            {/* Emoji du type d'utilisateur */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
              {getUserTypeEmoji(log.user_type)}
            </div>

            {/* Contenu du log */}
            <div className="flex-grow min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUserTypeColor(log.user_type)}`}>
                    {log.user_type}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    {log.user_id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{formatDate(log.timestamp)}</span>
                  <span title={formatFullDate(log.timestamp)}>⏰</span>
                </div>
              </div>

              <p className="text-gray-800 leading-relaxed">
                {log.action}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}