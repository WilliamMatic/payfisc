import type { ChassisStats, CorrectionStats } from "../types";

interface Props {
  chassisStats: ChassisStats | null;
  corrStats: CorrectionStats | null;
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint?: string;
  tone: "blue" | "amber" | "violet" | "emerald";
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-[11px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="text-[18px] font-semibold mt-1">{value}</div>
      {hint && <div className="text-[11px] opacity-70 mt-1">{hint}</div>}
    </div>
  );
}

export default function PageHeader({ chassisStats, corrStats }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#2D5B7A]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-[18px]">🛡️</span>
        </div>
        <div className="flex-1">
          <h1 className="text-[18px] font-semibold text-gray-900">
            Audit Refactor
          </h1>
          <p className="text-[13px] text-gray-600 mt-1">
            Suivi des numéros de châssis dupliqués et des corrections (old /
            new) effectuées via le module refactor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <StatCard
          label="Châssis dupliqués"
          value={chassisStats?.total ?? 0}
          hint={`${chassisStats?.last_7_days ?? 0} sur 7 jours`}
          tone="violet"
        />
        <StatCard
          label="Doublons aujourd'hui"
          value={chassisStats?.today ?? 0}
          tone="blue"
        />
        <StatCard
          label="Corrections refactor"
          value={corrStats?.total ?? 0}
          hint={`${corrStats?.last_7_days ?? 0} sur 7 jours`}
          tone="amber"
        />
        <StatCard
          label="Champs modifiés"
          value={corrStats?.total_changements ?? 0}
          hint="cumul des champs old/new"
          tone="emerald"
        />
      </div>
    </div>
  );
}
