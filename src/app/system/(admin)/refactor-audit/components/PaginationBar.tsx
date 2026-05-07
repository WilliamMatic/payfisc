"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination } from "../types";

interface Props {
  pagination: Pagination | null;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function PaginationBar({
  pagination,
  onPageChange,
  loading,
}: Props) {
  if (!pagination || pagination.total_pages <= 1) {
    return (
      <div className="flex justify-end pt-3">
        <span className="text-[11px] text-gray-500">
          {pagination ? `${pagination.total} résultat(s)` : ""}
        </span>
      </div>
    );
  }

  const { page, total_pages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3">
      <span className="text-[11px] text-gray-500">
        {start}–{end} sur {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[13px] text-gray-700 px-3">
          Page {page} / {total_pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages || loading}
          className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
