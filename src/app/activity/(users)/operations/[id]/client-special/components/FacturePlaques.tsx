'use client';
import { useState } from 'react';
import { X, Download, Printer } from 'lucide-react';

interface FactureData {
  particulier: {
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    adresse: string;
  };
  commande: {
    nombrePlaques: number;
    montantUnitaire: number;
    montantInitial: number;
    montantFinal: number;
  };
  reduction?: {
    type: string;
    valeur: number;
    montant_initial: number;
    montant_final: number;
  };
  plaques: string[];
  paiement: {
    mode_paiement: string;
    operateur?: string;
    numero_transaction?: string;
    numero_cheque?: string;
    banque?: string;
    date_paiement: string;
  };
  utilisateur: {
    nom_complet: string;
    site_nom: string;
  };
}

interface FacturePlaquesProps {
  data: FactureData;
  onClose: () => void;
}

export default function FacturePlaques({ data, onClose }: FacturePlaquesProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // const handlePrint = () => {
  //   setIsPrinting(true);
  //   setTimeout(() => {
  //     window.print();
  //     setIsPrinting(false);
  //   }, 500);
  // };

  const handleDownloadPDF = () => {
    // Implémentation de la génération PDF avec html2pdf.js
    // Vous pouvez installer html2pdf.js via npm
    console.log('Génération PDF...');
  };

  // Calcul des informations sur les plaques
  const premierePlaque = data.plaques[0] || 'N/A';
  const dernierePlaque = data.plaques[data.plaques.length - 1] || 'N/A';
  const totalPlaques = data.plaques.length;
  
  // Calcul de la série attribuée
  const seriesAttribuees = Array.from(new Set(
    data.plaques.map(plaque => plaque.substring(0, 2))
  )).join(', ');

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">Facture de Commande</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {/* Facture content */}
            <div className={`bg-white ${isPrinting ? 'p-0' : 'p-8'} border border-gray-200 rounded-lg`} id="facture-content">
              {/* En-tête de la facture */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">FACTURE D'IMMATRICULATION</h1>
                <div className="flex justify-between items-start mb-6">
                  <div className="text-left">
                    <p className="font-semibold">SYSTÈME D'IMMATRICULATION</p>
                    <p>Ministère des Transports</p>
                    <p>République Démocratique du Congo</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Facture N°: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    <p>Date: {new Date().toLocaleDateString('fr-FR')}</p>
                    <p>Heure: {new Date().toLocaleTimeString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              {/* Informations du client */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">INFORMATIONS DU CLIENT</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    {/* <p><strong>ID Assujetti:</strong> {data.particulier.id}</p> */}
                    <p><strong>Nom:</strong> {data.particulier.nom}</p>
                    <p><strong>Prénom:</strong> {data.particulier.prenom}</p>
                    <p><strong>Téléphone:</strong> {data.particulier.telephone}</p>
                  </div>
                  <div>
                    <p><strong>Email:</strong> {data.particulier.email}</p>
                    <p><strong>Adresse:</strong> {data.particulier.adresse}</p>
                  </div>
                </div>
              </div>

              {/* Détails de la commande */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">DÉTAILS DE LA COMMANDE</h2>
                <table className="w-full border-collapse border border-gray-300 text-sm">
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
                      <td className="border border-gray-300 p-2 text-center">{data.commande.nombrePlaques}</td>
                      <td className="border border-gray-300 p-2 text-right">{data.commande.montantUnitaire} $</td>
                      <td className="border border-gray-300 p-2 text-right">{data.commande.montantInitial} $</td>
                    </tr>
                    {data.reduction && (
                      <tr className="bg-green-50">
                        <td className="border border-gray-300 p-2" colSpan={3}>
                          Réduction ({data.reduction.type === 'pourcentage' ? `${data.reduction.valeur}%` : `${data.reduction.valeur}$`})
                        </td>
                        <td className="border border-gray-300 p-2 text-right text-green-600">
                          -{(data.commande.montantInitial - data.commande.montantFinal).toFixed(2)} $
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="border border-gray-300 p-2" colSpan={3}>TOTAL À PAYER</td>
                      <td className="border border-gray-300 p-2 text-right">{data.commande.montantFinal} $</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Informations des plaques */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">PLAQUES ATTRIBUÉES</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Première plaque:</strong> {premierePlaque}</p>
                    <p><strong>Dernière plaque:</strong> {dernierePlaque}</p>
                  </div>
                  <div>
                    <p><strong>Quantité totale:</strong> {totalPlaques} plaque(s)</p>
                    <p><strong>Série attribuée:</strong> {seriesAttribuees}</p>
                  </div>
                </div>
                {/* {data.plaques.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-2">Liste complète des plaques:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.plaques.map((plaque, index) => (
                        <span key={index} className="bg-white px-2 py-1 rounded border text-xs">
                          {plaque}
                        </span>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>

              {/* Informations de paiement */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">INFORMATIONS DE PAIEMENT</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Mode de paiement:</strong> {data.paiement.mode_paiement.toUpperCase()}</p>
                    {data.paiement.operateur && <p><strong>Opérateur:</strong> {data.paiement.operateur}</p>}
                    {data.paiement.numero_transaction && <p><strong>N° Transaction:</strong> {data.paiement.numero_transaction}</p>}
                  </div>
                  <div>
                    {data.paiement.numero_cheque && <p><strong>N° Chèque:</strong> {data.paiement.numero_cheque}</p>}
                    {data.paiement.banque && <p><strong>Banque:</strong> {data.paiement.banque}</p>}
                    <p><strong>Date paiement:</strong> {data.paiement.date_paiement}</p>
                  </div>
                </div>
              </div>

              {/* Informations du caissier */}
              {/* <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">INFORMATIONS DU CAISSIER</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Nom du caissier:</strong> {data.utilisateur.nom_complet}</p>
                  </div>
                  <div>
                    <p><strong>Site:</strong> {data.utilisateur.site_nom}</p>
                  </div>
                </div>
              </div> */}

              {/* Pied de page */}
              <div className="mt-8 pt-6 border-t border-gray-300 text-center text-xs text-gray-600">
                <p className="font-semibold">SYSTÈME D'IMMATRICULATION DES VÉHICULES - RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</p>
                <p>Cette facture est générée automatiquement et fait foi de preuve de paiement</p>
                <p className="mt-2">Merci pour votre confiance !</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
            <button
              // onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #facture-content,
          #facture-content * {
            visibility: visible;
          }
          #facture-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}