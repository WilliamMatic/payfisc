"use client";

export type TabKey = "chassis" | "corrections";

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  count: number | null;
}

interface Props {
  tabs: Tab[];
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export default function TabsNav({ tabs, active, onChange }: Props) {
  return (
    <div
      role="tablist"
      className="flex border-b border-gray-200 bg-white px-2"
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "text-[#2D5B7A]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="text-[15px]">{t.icon}</span>
            <span>{t.label}</span>
            {t.count !== null && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  isActive
                    ? "bg-[#2D5B7A]/10 text-[#2D5B7A]"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {t.count}
              </span>
            )}
            {isActive && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#2D5B7A]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
