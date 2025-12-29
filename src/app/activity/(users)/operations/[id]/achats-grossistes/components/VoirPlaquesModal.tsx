import { AchatPlaques } from "../types";

interface VoirPlaquesModalProps {
  showPlaquesModal: boolean;
  setShowPlaquesModal: (show: boolean) => void;
  selectedAchatForModal: AchatPlaques | null;
}

export default function VoirPlaquesModal({
  showPlaquesModal,
  setShowPlaquesModal,
  selectedAchatForModal
}: VoirPlaquesModalProps) {
  if (!showPlaquesModal || !selectedAchatForModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Toutes les plaques
            </h3>
            <p className="text-gray-600 mt-1">
              {selectedAchatForModal.assujetti.prenom}{" "}
              {selectedAchatForModal.assujetti.nom} •{" "}
              {selectedAchatForModal.nombre_plaques} plaque
              {selectedAchatForModal.nombre_plaques !== 1 ? "s" : ""} •{" "}
              {selectedAchatForModal.statut}
            </p>
          </div>
          <button
            onClick={() => setShowPlaquesModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {selectedAchatForModal.plaques_detail.map((plaque, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border text-center ${
                  plaque.estDelivree
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div
                  className={`font-mono font-semibold ${
                    plaque.estDelivree
                      ? "text-red-900"
                      : "text-gray-900"
                  }`}
                >
                  {plaque.numero}
                </div>
                <div className={`text-xs mt-1 ${
                  plaque.estDelivree
                    ? "text-red-600 font-medium"
                    : "text-gray-500"
                }`}>
                  #{index + 1}
                  {plaque.estDelivree && " • Déjà délivrée"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Série complète:</span>{" "}
            {selectedAchatForModal.serie_debut} →{" "}
            {selectedAchatForModal.serie_fin}
            {selectedAchatForModal.plaques_detail.some(p => p.estDelivree) && (
              <span className="ml-3 text-red-600">
                • Certaines plaques déjà délivrées
              </span>
            )}
          </div>
          <button
            onClick={() => setShowPlaquesModal(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}