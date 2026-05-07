"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import type {
  AuditFilters,
  Pagination,
  RefactorCorrection,
} from "../types";
import { DEFAULT_FILTERS } from "../types";
import FiltersBar from "./FiltersBar";
import RefactorCorrectionsTable from "./RefactorCorrectionsTable";
import PaginationBar from "./PaginationBar";
import CorrectionDetailsModal from "./modal/CorrectionDetailsModal";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Props {
  initialData: RefactorCorrection[];
  initialPagination: Pagination | null;
}

const SOURCE_OPTIONS = [
  { value: "locale", label: "Locale" },
  { value: "carte_reprint", label: "Carte reprint" },
  { value: "externe", label: "Externe" },
];

export default function RefactorCorrectionsPanel({
  initialData,
  initialPagination,
}: Props) {
  const [data, setData] = useState<RefactorCorrection[]>(initialData);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPagination,
  );
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchPage = useCallback(
    async (page: number, f: AuditFilters) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (f.source) params.set("source", f.source);
        if (f.site_id) params.set("site_id", f.site_id);
        if (f.date_debut) params.set("date_debut", f.date_debut);
        if (f.date_fin) params.set("date_fin", f.date_fin);
        if (f.search) params.set("search", f.search);

        const res = await fetch(
          `${API}/refactor-audit/refactor-corrections-list.php?${params.toString()}`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (json?.status !== "success") {
          throw new Error(json?.message || "Erreur");
        }
        setData(json.data ?? []);
        setPagination(json.pagination ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur réseau");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleApply = () => fetchPage(1, filters);
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    fetchPage(1, DEFAULT_FILTERS);
  };
  const handlePageChange = (p: number) => fetchPage(p, filters);

  return (
    <div>
      <FiltersBar
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        onReset={handleReset}
        sourceOptions={SOURCE_OPTIONS}
        searchPlaceholder="Rechercher par numéro de plaque…"
        loading={loading}
      />

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-[13px]">Chargement…</span>
        </div>
      ) : (
        <RefactorCorrectionsTable
          data={data}
          onView={(id) => setSelectedId(id)}
        />
      )}

      <PaginationBar
        pagination={pagination}
        onPageChange={handlePageChange}
        loading={loading}
      />

      {selectedId !== null && (
        <CorrectionDetailsModal
          correctionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
