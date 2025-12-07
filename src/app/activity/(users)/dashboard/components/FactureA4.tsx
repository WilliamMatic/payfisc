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
  montant_francs?: string;
  nif?: string;
  type_engin?: string;
  marque?: string;
  couleur?: string;
  annee_fabrication?: string;
}

interface FactureA4Props {
  factureData: FactureData;
  onClose: () => void;
}

export default function FactureA4({ factureData, onClose }: FactureA4Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Facture-${factureData.numeros_plaques[0] || 'PLAQUES'}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .facture-content, .facture-content * {
          visibility: visible;
        }
        .facture-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  });

  const reductionMontant = factureData.reduction_type && factureData.reduction_valeur 
    ? factureData.reduction_type === 'pourcentage' 
      ? (factureData.montant_initial * factureData.reduction_valeur) / 100
      : factureData.reduction_valeur * factureData.nombre_plaques
    : 0;

  const premierePlaque = factureData.numeros_plaques[0] || '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl mx-auto my-8 p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Facture d'immatriculation</h3>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors no-print"
            >
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors no-print"
            >
              Fermer
            </button>
          </div>
        </div>

        <div 
          ref={contentRef} 
          className="facture-content bg-white p-6 mx-auto border border-gray-200"
          style={{ 
            width: '210mm',
            minHeight: '297mm',
          }}
        >
          {/* En-tête */}
          <div className="text-center border-b border-gray-300 pb-3 mb-4">
            <h1 className="text-xl font-bold text-gray-900">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h1>
            <h2 className="text-lg font-semibold text-gray-800 mt-1">TSC-NPS</h2>
            <p className="text-sm text-gray-600 mt-1">{factureData.site_nom}</p>
          </div>

          {/* Titre Facture */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-blue-800 uppercase">FACTURE D'IMMATRICULATION</h3>
            <p className="text-gray-600 text-sm mt-1">N°: {factureData.numeros_plaques[0] || 'N/A'}</p>
          </div>

          {/* Informations Client */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-bold text-md text-gray-900 mb-2 border-b pb-1">INFORMATIONS DU PROPRIÉTAIRE</h4>
              <div className="space-y-1 text-xs">
                <div><strong>Nom:</strong> {factureData.nom}</div>
                <div><strong>Prénom:</strong> {factureData.prenom}</div>
                <div><strong>NIF:</strong> {factureData.nif || 'Non renseigné'}</div>
                <div><strong>Téléphone:</strong> {factureData.telephone || 'Non renseigné'}</div>
                <div><strong>Email:</strong> {factureData.email || 'Non renseigné'}</div>
                <div><strong>Adresse:</strong> {factureData.adresse || 'Non renseigné'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-md text-gray-900 mb-2 border-b pb-1">INFORMATIONS DE L'ENGIN</h4>
              <div className="space-y-1 text-xs">
                <div><strong>Type:</strong> {factureData.type_engin || 'Non renseigné'}</div>
                <div><strong>Marque:</strong> {factureData.marque || 'Non renseigné'}</div>
                <div><strong>Couleur:</strong> {factureData.couleur || 'Non renseigné'}</div>
                <div><strong>Année:</strong> {factureData.annee_fabrication || 'Non renseigné'}</div>
                <div><strong>Numéro Plaque:</strong> {premierePlaque}</div>
              </div>
            </div>
          </div>

          {/* Informations de la Facture */}
          <div className="mb-6">
            <h4 className="font-bold text-md text-gray-900 mb-2 border-b pb-1">DÉTAILS DU PAIEMENT</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div><strong>Date:</strong> {new Date(factureData.date_paiement).toLocaleDateString('fr-FR')}</div>
                <div><strong>Heure:</strong> {new Date(factureData.date_paiement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                <div><strong>Mode paiement:</strong> {factureData.mode_paiement.toUpperCase()}</div>
              </div>
              <div>
                {factureData.operateur && <div><strong>Opérateur:</strong> {factureData.operateur.toUpperCase()}</div>}
                {factureData.numero_transaction && <div><strong>N° Transaction:</strong> {factureData.numero_transaction}</div>}
                <div><strong>Site:</strong> {factureData.site_nom}</div>
              </div>
            </div>
          </div>

          {/* Détails de la Commande */}
          <div className="mb-6">
            <h4 className="font-bold text-md text-gray-900 mb-2 border-b pb-1">DÉTAILS DE LA COMMANDE</h4>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-left">Description</th>
                  <th className="border border-gray-300 p-1 text-center">Quantité</th>
                  <th className="border border-gray-300 p-1 text-right">Prix Unitaire</th>
                  <th className="border border-gray-300 p-1 text-right">Montant ($)</th>
                  <th className="border border-gray-300 p-1 text-right">Montant (CDF)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-1">Immatriculation véhicule</td>
                  <td className="border border-gray-300 p-1 text-center">1</td>
                  <td className="border border-gray-300 p-1 text-right">
                    {factureData.montant_initial.toFixed(2)} $
                  </td>
                  <td className="border border-gray-300 p-1 text-right">{factureData.montant_initial.toFixed(2)} $</td>
                  <td className="border border-gray-300 p-1 text-right">{factureData.montant_francs || 'N/A'}</td>
                </tr>
                {reductionMontant > 0 && (
                  <tr>
                    <td className="border border-gray-300 p-1" colSpan={3}>
                      Réduction ({factureData.reduction_type === 'pourcentage' 
                        ? `${factureData.reduction_valeur}%` 
                        : `${factureData.reduction_valeur}$`})
                    </td>
                    <td className="border border-gray-300 p-1 text-right text-red-600">
                      -{reductionMontant.toFixed(2)} $
                    </td>
                    <td className="border border-gray-300 p-1 text-right text-red-600">
                      -
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="border border-gray-300 p-1" colSpan={3}>TOTAL</td>
                  <td className="border border-gray-300 p-1 text-right">{factureData.montant.toFixed(2)} $</td>
                  <td className="border border-gray-300 p-1 text-right">{factureData.montant_francs || 'N/A'}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Numéro de Plaque */}
          <div className="mb-6">
            <h4 className="font-bold text-md text-gray-900 mb-2 border-b pb-1">NUMÉRO DE PLAQUE ATTRIBUÉ</h4>
            <div className="flex justify-center">
              <div className="bg-blue-50 border-2 border-blue-300 p-4 text-center rounded-lg min-w-[150px]">
                <span className="font-mono font-bold text-blue-800 text-xl">{premierePlaque}</span>
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <h5 className="font-bold text-yellow-800 mb-1">INFORMATIONS IMPORTANTES:</h5>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li>Cette facture est un justificatif de paiement officiel</li>
              <li>Conservez ce document pour toute réclamation</li>
              <li>La plaque est attribuée définitivement au véhicule</li>
              <li>Validité immédiate après paiement</li>
              {factureData.reduction_type && factureData.reduction_valeur && (
                <li>
                  Réduction appliquée: {factureData.reduction_type === 'pourcentage' 
                    ? `${factureData.reduction_valeur}%` 
                    : `${factureData.reduction_valeur}$`}
                </li>
              )}
            </ul>
          </div>

          {/* Pied de page */}
          <div className="border-t border-gray-300 pt-3 text-center text-xs text-gray-600">
            <p className="font-semibold">Ce document fait foi de paiement et d'attribution de plaque.</p>
            <div className="mt-4 flex justify-between items-start">
              <div className="text-left">
                <p className="font-semibold">Cachet et signature</p>
                <div className="mt-8 border-t border-gray-400 w-32"></div>
                <p className="text-xs mt-1">TSC-NPS</p>
                <p className="text-xs text-gray-500">{factureData.site_nom}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Signature du propriétaire</p>
                <div className="mt-8 border-t border-gray-400 w-32 ml-auto"></div>
                <p className="text-xs mt-1">{factureData.prenom} {factureData.nom}</p>
                <p className="text-xs text-gray-500">NIF: {factureData.nif || 'Non renseigné'}</p>
              </div>
            </div>
            
            {/* Numéro de référence */}
            <div className="mt-4 p-2 bg-gray-100 rounded border border-gray-300">
              <p className="font-mono text-xs">
                Réf: {premierePlaque} | 
                Date: {new Date(factureData.date_paiement).toLocaleDateString('fr-FR')} | 
                Client: {factureData.nom.slice(0, 3).toUpperCase()}{factureData.prenom.slice(0, 3).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}