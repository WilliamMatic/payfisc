import { Search } from "lucide-react";
import DateGroup from "./DateGroup";
import TableList from "./TableList";
import { AchatPlaques, GroupedAchats, ViewMode } from "../types";

interface ResultatsProps {
  filteredAchats: AchatPlaques[];
  achatsGroupes: GroupedAchats[];
  viewMode: ViewMode;
  expandedDates: Set<string>;
  isPending: boolean;
  loading: boolean;
  formaterDate: (dateStr: string) => string;
  formaterDateLongue: (dateStr: string) => string;
  formaterSeriePlaques: (achat: AchatPlaques) => string;
  toggleDateExpansion: (date: string) => void;
  afficherToutesPlaques: (achat: AchatPlaques) => void;
}

export default function Resultats({
  filteredAchats,
  achatsGroupes,
  viewMode,
  expandedDates,
  isPending,
  loading,
  formaterDate,
  formaterDateLongue,
  formaterSeriePlaques,
  toggleDateExpansion,
  afficherToutesPlaques
}: ResultatsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {viewMode === "grouped"
            ? "Achats Groupés par Date"
            : "Tous les Achats"}
        </h2>
        <p className="text-gray-600">
          {filteredAchats.length} résultat
          {filteredAchats.length !== 1 ? "s" : ""} trouvé
          {filteredAchats.length !== 1 ? "s" : ""}
        </p>
      </div>

      {isPending && filteredAchats.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des résultats...</p>
        </div>
      ) : filteredAchats.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun résultat
          </h3>
          <p className="text-gray-600">
            Aucun achat ne correspond à vos critères de recherche
          </p>
        </div>
      ) : viewMode === "grouped" ? (
        // Vue groupée par date
        <div className="space-y-6">
          {achatsGroupes.map((groupe) => (
            <DateGroup
              key={groupe.date}
              groupe={groupe}
              expandedDates={expandedDates}
              formaterDateLongue={formaterDateLongue}
              toggleDateExpansion={toggleDateExpansion}
              afficherToutesPlaques={afficherToutesPlaques}
              formaterSeriePlaques={formaterSeriePlaques}
            />
          ))}
        </div>
      ) : (
        // Vue liste simple
        <TableList
          filteredAchats={filteredAchats}
          formaterDate={formaterDate}
          formaterSeriePlaques={formaterSeriePlaques}
          afficherToutesPlaques={afficherToutesPlaques}
        />
      )}
    </div>
  );
}