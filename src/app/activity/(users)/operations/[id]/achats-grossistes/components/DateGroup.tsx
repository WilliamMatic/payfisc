import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import AchatCard from "./AchatCard";
import { GroupedAchats, AchatPlaques } from "../types";

interface DateGroupProps {
  groupe: GroupedAchats;
  expandedDates: Set<string>;
  formaterDateLongue: (dateStr: string) => string;
  toggleDateExpansion: (date: string) => void;
  afficherToutesPlaques: (achat: AchatPlaques) => void;
  formaterSeriePlaques: (achat: AchatPlaques) => string;
}

export default function DateGroup({
  groupe,
  expandedDates,
  formaterDateLongue,
  toggleDateExpansion,
  afficherToutesPlaques,
  formaterSeriePlaques
}: DateGroupProps) {
  const isExpanded = expandedDates.has(groupe.date);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête de date */}
      <div
        className="px-6 py-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => toggleDateExpansion(groupe.date)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {formaterDateLongue(groupe.date)}
              </h3>
              <p className="text-sm text-gray-600">
                {groupe.achats.length} achat
                {groupe.achats.length !== 1 ? "s" : ""} •{" "}
                {groupe.totalPlaques} plaques •{" "}
                {groupe.totalMontant.toLocaleString("fr-FR")} $
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {isExpanded ? "Réduire" : "Développer"}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Contenu développé */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {groupe.achats.map((achat) => (
            <AchatCard
              key={achat.id}
              achat={achat}
              afficherToutesPlaques={afficherToutesPlaques}
              formaterSeriePlaques={formaterSeriePlaques}
            />
          ))}
        </div>
      )}
    </div>
  );
}