// components/FactureA4.tsx
'use client';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface FactureData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  montant: number;
  montant_initial: number;
  mode_paiement: string;
  operateur: string;
  numero_transaction: string;
  date_paiement: string;
  nombre_plaques: number;
  site_nom: string;
  caissier: string;
  numeros_plaques: string[];
  reduction_type?: string;
  reduction_valeur?: number;
}

interface FactureA4Props {
  factureData: FactureData;
  onClose: () => void;
}

export default function FactureA4({ factureData, onClose }: FactureA4Props) {
  const factureRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => factureRef.current,
    documentTitle: `Facture-${factureData.numeros_plaques[0] || 'PLAQUES'}`,
    onAfterPrint: onClose
  });

  const reductionMontant = factureData.reduction_type && factureData.reduction_valeur 
    ? factureData.reduction_type === 'pourcentage' 
      ? (factureData.montant_initial * factureData.reduction_valeur) / 100
      : factureData.reduction_valeur
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Facture A4</h3>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        <div ref={factureRef} className="bg-white p-8 A4-page">
          <style jsx>{`
            .A4-page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 20mm;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              background: white;
            }
            @media print {
              .A4-page {
                box-shadow: none;
                margin: 0;
                padding: 15mm;
              }
            }
          `}</style>

          {/* En-tête */}
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mt-2">DIRECTION GÉNÉRALE DES IMPÔTS</h2>
            <p className="text-lg text-gray-600 mt-1">{factureData.site_nom}</p>
          </div>

          {/* Titre Facture */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-blue-800 uppercase">FACTURE D'ACHAT DE PLAQUES</h3>
            <p className="text-gray-600 mt-2">Reçu de paiement N°: {factureData.numeros_plaques[0] || 'N/A'}</p>
          </div>

          {/* Informations Client */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-3 border-b pb-1">INFORMATIONS DU CLIENT</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Nom:</strong> {factureData.nom}</div>
                <div><strong>Prénom:</strong> {factureData.prenom}</div>
                <div><strong>Téléphone:</strong> {factureData.telephone}</div>
                <div><strong>Email:</strong> {factureData.email}</div>
                <div><strong>Adresse:</strong> {factureData.adresse}</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-3 border-b pb-1">INFORMATIONS DE LA FACTURE</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Date:</strong> {new Date(factureData.date_paiement).toLocaleDateString()}</div>
                <div><strong>Heure:</strong> {new Date(factureData.date_paiement).toLocaleTimeString()}</div>
                <div><strong>Mode paiement:</strong> {factureData.mode_paiement}</div>
                {factureData.operateur && <div><strong>Opérateur:</strong> {factureData.operateur}</div>}
                {factureData.numero_transaction && <div><strong>N° Transaction:</strong> {factureData.numero_transaction}</div>}
                <div><strong>Caissier:</strong> {factureData.caissier}</div>
              </div>
            </div>
          </div>

          {/* Détails de la Commande */}
          <div className="mb-8">
            <h4 className="font-bold text-lg text-gray-900 mb-3 border-b pb-1">DÉTAILS DE LA COMMANDE</h4>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Description</th>
                  <th className="border border-gray-300 p-2 text-center">Quantité</th>
                  <th className="border border-gray-300 p-2 text-right">Prix Unitaire</th>
                  <th className="border border-gray-300 p-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Plaques d'immatriculation</td>
                  <td className="border border-gray-300 p-2 text-center">{factureData.nombre_plaques}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    {(factureData.montant_initial / factureData.nombre_plaques).toFixed(2)} $
                  </td>
                  <td className="border border-gray-300 p-2 text-right">{factureData.montant_initial.toFixed(2)} $</td>
                </tr>
                {reductionMontant > 0 && (
                  <tr>
                    <td className="border border-gray-300 p-2" colSpan={3}>
                      Réduction ({factureData.reduction_type === 'pourcentage' ? `${factureData.reduction_valeur}%` : 'Montant fixe'})
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-red-600">
                      -{reductionMontant.toFixed(2)} $
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="border border-gray-300 p-2" colSpan={3}>TOTAL</td>
                  <td className="border border-gray-300 p-2 text-right">{factureData.montant.toFixed(2)} $</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Numéros de Plaques Attribués */}
          <div className="mb-8">
            <h4 className="font-bold text-lg text-gray-900 mb-3 border-b pb-1">NUMÉROS DE PLAQUES ATTRIBUÉS</h4>
            <div className="grid grid-cols-3 gap-2">
              {factureData.numeros_plaques.map((numero, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 p-3 text-center rounded">
                  <span className="font-mono font-bold text-blue-800">{numero}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pied de page */}
          <div className="border-t-2 border-gray-300 pt-4 text-center text-sm text-gray-600">
            <p>Ce document fait foi de paiement et d'attribution des plaques mentionnées ci-dessus.</p>
            <p className="mt-2">Merci pour votre confiance !</p>
            <div className="mt-6 flex justify-between">
              <div className="text-left">
                <p>Cachet et signature</p>
                <div className="mt-16 border-t border-gray-400 w-48"></div>
                <p className="text-xs">Direction Générale des Impôts</p>
              </div>
              <div className="text-right">
                <p>Signature du client</p>
                <div className="mt-16 border-t border-gray-400 w-48 ml-auto"></div>
                <p className="text-xs">{factureData.prenom} {factureData.nom}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}