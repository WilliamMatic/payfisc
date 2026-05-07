"use client";
import { ArrowRight } from "lucide-react";

interface ParticulierInfo {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse: string;
  ville?: string;
  province?: string;
  nif?: string;
}

interface ModalVerificationProps {
  isOpen: boolean;
  particulierInfo: ParticulierInfo | null;
  numeroPlaque: string;
  onAnnuler: () => void;
  onContinuer: () => void;
}

export default function ModalVerification({
  isOpen,
  particulierInfo,
  numeroPlaque,
  onAnnuler,
  onContinuer,
}: ModalVerificationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="p-6">
          <h3 className="font-bold text-lg mb-4 text-green-600">
            ✅ Vérification Réussie
          </h3>

          <div className="space-y-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">
                Particulier Trouvé
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-600">Nom:</span>
                  <span className="font-medium">
                    {particulierInfo?.nom} {particulierInfo?.prenom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Téléphone:</span>
                  <span className="font-medium">
                    {particulierInfo?.telephone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Adresse:</span>
                  <span className="font-medium">
                    {particulierInfo?.adresse}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-400 text-center">
              <div className="text-blue-800 text-sm mb-2">
                Plaque vérifiée et disponible
              </div>
              <div className="text-3xl font-bold text-blue-700 bg-white py-3 px-6 rounded-lg border-2 border-blue-500">
                {numeroPlaque}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onAnnuler}
              className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={onContinuer}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Passer au Formulaire</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
