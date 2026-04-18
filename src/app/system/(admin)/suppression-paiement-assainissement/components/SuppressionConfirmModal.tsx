"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { PaiementAssainissement } from "./types";

interface SuppressionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paiement: PaiementAssainissement | null;
}

export default function SuppressionConfirmModal({ isOpen, onClose, onSuccess, paiement }: SuppressionConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !paiement) return null;

  const nomComplet = `${paiement.contribuable_nom || ""} ${paiement.contribuable_prenom || ""}`.trim();

  const handleConfirm = async () => {
    if (confirmText !== "SUPPRIMER") return;
    setIsDeleting(true);
    try {
      await onSuccess();
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose}></div>

        <div className="relative inline-block w-full max-w-md bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirmer la suppression</h3>
                  <p className="text-red-200 text-sm">Cette action est irréversible</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 font-medium mb-2">Vous allez supprimer :</p>
              <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
                <li>Le paiement <span className="font-mono font-bold">{paiement.reference}</span></li>
                <li>Montant : <span className="font-bold">{Number(paiement.montant).toLocaleString("fr-FR")} FC</span></li>
                <li>Contribuable : <span className="font-medium">{nomComplet || "—"}</span></li>
                {paiement.nom_etablissement && (
                  <li>Établissement : <span className="font-medium">{paiement.nom_etablissement}</span></li>
                )}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>Conséquences :</strong> La répartition des bénéficiaires sera supprimée et la facture associée sera remise au statut &quot;impayée&quot;.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tapez <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">SUPPRIMER</span> pour confirmer :
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Tapez SUPPRIMER ici..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-center font-mono font-bold text-lg tracking-widest"
                autoFocus
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmText !== "SUPPRIMER" || isDeleting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Supprimer définitivement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
