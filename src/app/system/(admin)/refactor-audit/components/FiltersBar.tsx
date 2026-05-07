"use client";

import { Search, RotateCcw } from "lucide-react";
import type { AuditFilters } from "../types";

interface Props {
  filters: AuditFilters;
  onChange: (next: AuditFilters) => void;
  onApply: () => void;
  onReset: () => void;
  sourceOptions: { value: string; label: string }[];
  searchPlaceholder: string;
  loading?: boolean;
}

export default function FiltersBar({
  filters,
  onChange,
  onApply,
  onReset,
  sourceOptions,
  searchPlaceholder,
  loading,
}: Props) {
  const set = <K extends keyof AuditFilters>(k: K, v: AuditFilters[K]) =>
    onChange({ ...filters, [k]: v });

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply();
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D5B7A] focus:ring-1 focus:ring-[#2D5B7A]/20"
          />
        </div>

        <select
          value={filters.source}
          onChange={(e) => set("source", e.target.value)}
          className="md:col-span-2 px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D5B7A] focus:ring-1 focus:ring-[#2D5B7A]/20"
        >
          <option value="">Toutes sources</option>
          {sourceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.date_debut}
          onChange={(e) => set("date_debut", e.target.value)}
          className="md:col-span-2 px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D5B7A] focus:ring-1 focus:ring-[#2D5B7A]/20"
        />
        <input
          type="date"
          value={filters.date_fin}
          onChange={(e) => set("date_fin", e.target.value)}
          className="md:col-span-2 px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D5B7A] focus:ring-1 focus:ring-[#2D5B7A]/20"
        />

        <div className="md:col-span-2 flex gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm font-medium bg-[#2D5B7A] text-white rounded-lg hover:bg-[#244D68] transition-colors disabled:opacity-50"
          >
            Filtrer
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Réinitialiser"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
