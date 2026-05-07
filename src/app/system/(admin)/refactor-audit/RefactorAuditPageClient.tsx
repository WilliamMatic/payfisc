"use client";

import { useState } from "react";
import type {
  ChassisDuplicate,
  ChassisStats,
  CorrectionStats,
  Pagination,
  RefactorCorrection,
} from "./types";
import PageHeader from "./components/PageHeader";
import TabsNav, { type TabKey } from "./components/TabsNav";
import ChassisDuplicatesPanel from "./components/ChassisDuplicatesPanel";
import RefactorCorrectionsPanel from "./components/RefactorCorrectionsPanel";

interface InitialData {
  chassisStats: ChassisStats | null;
  chassisInitial: {
    data: ChassisDuplicate[];
    pagination: Pagination | null;
  };
  corrStats: CorrectionStats | null;
  corrInitial: {
    data: RefactorCorrection[];
    pagination: Pagination | null;
  };
}

interface Props {
  initial: InitialData;
}

export default function RefactorAuditPageClient({ initial }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("chassis");

  const tabs = [
    {
      key: "chassis" as const,
      label: "Châssis dupliqués",
      icon: "🔗",
      count: initial.chassisStats?.total ?? null,
    },
    {
      key: "corrections" as const,
      label: "Corrections (old / new)",
      icon: "✏️",
      count: initial.corrStats?.total ?? null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          chassisStats={initial.chassisStats}
          corrStats={initial.corrStats}
        />

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TabsNav tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <div className="p-4 md:p-5">
            {activeTab === "chassis" ? (
              <ChassisDuplicatesPanel
                initialData={initial.chassisInitial.data}
                initialPagination={initial.chassisInitial.pagination}
              />
            ) : (
              <RefactorCorrectionsPanel
                initialData={initial.corrInitial.data}
                initialPagination={initial.corrInitial.pagination}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
