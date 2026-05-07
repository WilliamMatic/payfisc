"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import type {
  AuditFilters,
  ChassisDuplicate,
  Pagination,
} from "../types";
import { DEFAULT_FILTERS } from "../types";
import FiltersBar from "./FiltersBar";
import ChassisDuplicatesTable from "./ChassisDuplicatesTable";
import PaginationBar from "./PaginationBar";
import ChassisDetailsModal from "./modal/ChassisDetailsModal";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Props {
  initialData: ChassisDuplicate[];
  initialPagination: Pagination | null;
}

const SOURCE_OPTIONS = [
  { value: "carte_rose", label: "Carte rose" },
  { value: "client_simple", label: "Client simple" },
  { value: "refactor", label: "Refactor" },
];

export default function ChassisDuplicatesPanel({
  initialData,
  initialPagination,
}: Props) {
  const [data, setData] = useState<ChassisDuplicate[]>(initialData);
  const [pagination, setPagination] = useState<Pagination | null>(
    initialPagination,
  );
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ChassisDuplicate | null>(null);

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
          `${API}/refactor-audit/chassis-duplicates-list.php?${params.toString()}`,
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
        searchPlaceholder="Rechercher par châssis ou plaque…"
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
        <ChassisDuplicatesTable
          data={data}
          onView={(row) => setSelected(row)}
        />
      )}

      <PaginationBar
        pagination={pagination}
        onPageChange={handlePageChange}
        loading={loading}
      />

      {selected && (
        <ChassisDetailsModal
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
