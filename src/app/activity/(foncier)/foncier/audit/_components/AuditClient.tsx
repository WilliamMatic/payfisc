"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAuditLogs } from "@/services/foncier/foncierService";
import { AuditLog } from "@/services/foncier/types";
import { formatDateTime } from "../../_shared/format";

export default function AuditClient() {
  const { utilisateur } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const r = await getAuditLogs(utilisateur.site_id, page, 30);
    if (r.status === "success" && r.data) {
      setLogs(r.data.logs);
      setTotalPages(r.data.pagination.totalPages);
    }
    setLoading(false);
  }, [utilisateur?.site_id, page]);

  useEffect(() => { load(); }, [load]);

  const actionColor = (a: string) => {
    if (a.includes("ajout") || a.includes("creat")) return "bg-blue-100 text-blue-800";
    if (a.includes("valid")) return "bg-green-100 text-green-800";
    if (a.includes("rejet") || a.includes("suppr") || a.includes("annul")) return "bg-red-100 text-red-800";
    if (a.includes("paiement")) return "bg-emerald-100 text-emerald-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">📜 Audit / Historique</h1>
        <p className="text-sm text-gray-500">Journal complet des actions du module foncier</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
        : logs.length === 0 ? <div className="p-8 text-center text-gray-500">Aucun enregistrement</div>
        : <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Entité</th>
              <th className="text-left px-4 py-3">Description</th>
              <th className="text-left px-4 py-3">Utilisateur</th>
            </tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDateTime(l.date_creation)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${actionColor(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{l.entity_type} #{l.entity_id ?? "—"}</td>
                  <td className="px-4 py-3">{l.description || "—"}</td>
                  <td className="px-4 py-3 text-xs">{l.utilisateur_nom || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Préc.</button>
          <span className="px-3 py-1">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Suiv.</button>
        </div>
      )}
    </div>
  );
}
