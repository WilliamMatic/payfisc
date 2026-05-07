import { Suspense } from "react";
import type { Metadata } from "next";
import RefactorAuditPageClient from "./RefactorAuditPageClient";
import RefactorAuditSkeleton from "./components/RefactorAuditSkeleton";

export const metadata: Metadata = {
  title: "Audit Refactor — PayFisc",
  description:
    "Suivi des numéros de châssis dupliqués et des corrections (old/new) effectuées via le refactor.",
};

const API = process.env.NEXT_PUBLIC_API_URL;

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.status === "success" ? json : null;
  } catch {
    return null;
  }
}

async function getInitialData() {
  const [chassisStats, chassisList, corrStats, corrList] = await Promise.all([
    fetchJson(`${API}/refactor-audit/chassis-duplicates-stats.php`),
    fetchJson(
      `${API}/refactor-audit/chassis-duplicates-list.php?page=1&limit=20`,
    ),
    fetchJson(`${API}/refactor-audit/refactor-corrections-stats.php`),
    fetchJson(
      `${API}/refactor-audit/refactor-corrections-list.php?page=1&limit=20`,
    ),
  ]);

  return {
    chassisStats: chassisStats?.data ?? null,
    chassisInitial: {
      data: chassisList?.data ?? [],
      pagination: chassisList?.pagination ?? null,
    },
    corrStats: corrStats?.data ?? null,
    corrInitial: {
      data: corrList?.data ?? [],
      pagination: corrList?.pagination ?? null,
    },
  };
}

export default async function RefactorAuditPage() {
  const initial = await getInitialData();
  return (
    <Suspense fallback={<RefactorAuditSkeleton />}>
      <RefactorAuditPageClient initial={initial} />
    </Suspense>
  );
}
