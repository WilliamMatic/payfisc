"use client";
import { X, Download, Printer, FileText, ChevronDown, ChevronUp, User, CreditCard, Calendar, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getRapportGeneral,
  VerificationFilters,
} from "@/services/dashboard/dashboardService";

interface Beneficiaire {
  id: number;
  nom: string;
  telephone: string;
  numero_compte: string;
  type_part: string;
  valeur_part_originale: number;
  valeur_part_calculee: number;
  montant: number;
}

interface Declaration {
  id: number;
  reference: string;
  nom_impot: string;
  contribuable: string;
  type_contribuable: string;
  nif_contribuable: string;
  montant_du: number;
  montant_paye: number;
  solde: number;
  methode_paiement: string;
  lieu_paiement: string;
  statut: string;
  date_creation: string;
  donnees_json: string;
  donnees_json_decoded?: any;
  beneficiaires: Beneficiaire[];
  total_beneficiaires: number;
  code_impot: string;
  periode_fiscale: string;
}

interface RapportGeneralData {
  declarations: Declaration[];
  totaux: {
    total_montant_du: number;
    total_montant_paye: number;
    total_solde: number;
    total_declarations: number;
    declarations_payees: number;
    declarations_en_attente: number;
    declarations_rejetees: number;
  };
  filtres_appliques: VerificationFilters;
  date_generation: string;
}

interface RapportGeneralModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: VerificationFilters;
}

export default function RapportGeneralModal({
  isOpen,
  onClose,
  filters,
}: RapportGeneralModalProps) {
  const [rapport, setRapport] = useState<RapportGeneralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDeclarations, setExpandedDeclarations] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadRapportGeneral();
    }
  }, [isOpen]);

  const loadRapportGeneral = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getRapportGeneral(filters);

      if (result.status === "success") {
        setRapport(result.data);
      } else {
        setError(
          result.message || "Erreur lors du chargement du rapport général"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors du chargement du rapport général:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeclaration = (declarationId: number) => {
    setExpandedDeclarations(prev =>
      prev.includes(declarationId)
        ? prev.filter(id => id !== declarationId)
        : [...prev, declarationId]
    );
  };

  const handlePrint = () => {
    const printContent = document.getElementById('rapport-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Rapport Général des Déclarations</title>
              <style>
                @page { margin: 1cm; size: A4; }
                body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  font-size: 12px; 
                  line-height: 1.4;
                  color: #333;
                  margin: 0;
                  padding: 0;
                }
                .header { 
                  border-bottom: 3px solid #2c3e50; 
                  padding-bottom: 15px; 
                  margin-bottom: 20px;
                }
                .section { margin-bottom: 25px; }
                .declaration { 
                  border: 1px solid #ddd; 
                  margin-bottom: 15px;
                  page-break-inside: avoid;
                }
                .declaration-header { 
                  background: #f8f9fa; 
                  padding: 12px; 
                  border-bottom: 1px solid #ddd;
                }
                .declaration-content { padding: 15px; }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  font-size: 10px;
                  margin: 10px 0;
                }
                th { 
                  background: #2c3e50; 
                  color: white; 
                  padding: 8px; 
                  text-align: left;
                  font-weight: 600;
                }
                td { 
                  border: 1px solid #ddd; 
                  padding: 8px; 
                }
                .total-row { background: #e9ecef; font-weight: bold; }
                .beneficiary-section { margin: 15px 0; }
                .data-grid { 
                  display: grid; 
                  grid-template-columns: 1fr 1fr; 
                  gap: 15px; 
                  margin: 15px 0;
                }
                .data-card { 
                  border: 1px solid #e9ecef; 
                  padding: 12px; 
                  border-radius: 6px;
                  background: #f8f9fa;
                }
                .footer { 
                  margin-top: 30px; 
                  padding-top: 15px; 
                  border-top: 1px solid #ddd;
                  text-align: center;
                  font-size: 9px;
                  color: #666;
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  // Fonction pour formater les données JSON en affichage lisible
  const formatDonneesJSON = (donnees: any) => {
    if (!donnees) return null;

    const formatKey = (key: string) => {
      return key.replace(/_/g, ' ')
               .replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return 'Non renseigné';
      if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
      if (typeof value === 'number') {
        if (value.toString().includes('.')) {
          return value.toFixed(2);
        }
        return value.toString();
      }
      if (typeof value === 'string') {
        // Si c'est une date
        if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
          return new Date(value).toLocaleDateString('fr-FR');
        }
        return value;
      }
      if (Array.isArray(value)) {
        return value.map(v => formatValue(v)).join(', ');
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    };

    return Object.entries(donnees)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        label: formatKey(key),
        value: formatValue(value)
      }));
  };

  // Calcul du solde avec pénalités (ne peut pas être négatif)
  const calculerSoldeAvecPenalites = (declaration: Declaration) => {
    const penalites = declaration.donnees_json_decoded?.penalites || 0;
    const soldeBase = declaration.montant_du - declaration.montant_paye;
    const soldeTotal = Math.max(0, soldeBase + penalites);
    
    return {
      solde: soldeTotal,
      penalites: penalites,
      montantTotal: declaration.montant_du + penalites
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Rapport Général des Déclarations
              </h3>
              <p className="text-sm text-gray-500">
                Synthèse complète des déclarations fiscales
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer size={16} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Génération du rapport en cours...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
              {error}
            </div>
          )}

          {rapport && (
            <>
              {/* Version écran */}
              <div className="space-y-6">
                {/* En-tête principal */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-2xl p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h1>
                      <h2 className="text-xl font-semibold mb-1">DIRECTION GÉNÉRALE DES IMPÔTS</h2>
                      <p className="text-blue-200 text-sm">Service des Déclarations Fiscales</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/20 rounded-lg p-4">
                        <p className="text-lg font-semibold">RAPPORT GÉNÉRAL</p>
                        <p className="text-blue-200 text-sm">N° {new Date().getTime()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Résumé statistique */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white border border-blue-200 rounded-xl p-4 text-center">
                    <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Montant Total Dû</p>
                    <p className="text-lg font-bold text-blue-700">
                      {rapport.totaux.total_montant_du.toLocaleString()} $
                    </p>
                  </div>
                  <div className="bg-white border border-green-200 rounded-xl p-4 text-center">
                    <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Montant Payé</p>
                    <p className="text-lg font-bold text-green-700">
                      {rapport.totaux.total_montant_paye.toLocaleString()} $
                    </p>
                  </div>
                  <div className="bg-white border border-orange-200 rounded-xl p-4 text-center">
                    <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Solde Restant</p>
                    <p className="text-lg font-bold text-orange-700">
                      {Math.max(0, rapport.totaux.total_solde).toLocaleString()} $
                    </p>
                  </div>
                  <div className="bg-white border border-purple-200 rounded-xl p-4 text-center">
                    <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Déclarations</p>
                    <p className="text-lg font-bold text-purple-700">
                      {rapport.totaux.total_declarations}
                    </p>
                  </div>
                </div>

                {/* Liste des déclarations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    DÉCLARATIONS FISCALES
                  </h3>
                  
                  {rapport.declarations.map((declaration) => {
                    const soldeCalcul = calculerSoldeAvecPenalites(declaration);
                    const donneesFormatees = formatDonneesJSON(declaration.donnees_json_decoded);

                    return (
                      <div key={declaration.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        {/* En-tête déclaration */}
                        <div 
                          className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors border-b"
                          onClick={() => toggleDeclaration(declaration.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-4">
                              <div className="flex items-center space-x-2">
                                {expandedDeclarations.includes(declaration.id) ? (
                                  <ChevronUp size={18} className="text-gray-500 mt-1" />
                                ) : (
                                  <ChevronDown size={18} className="text-gray-500 mt-1" />
                                )}
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                  declaration.statut === "payé" 
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : declaration.statut === "en_attente" 
                                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                                    : "bg-red-100 text-red-800 border border-red-200"
                                }`}>
                                  {declaration.statut === "payé" ? "✅ Payé" :
                                   declaration.statut === "en_attente" ? "⏳ En attente" : "❌ Rejeté"}
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-lg">
                                  {declaration.reference}
                                </p>
                                <p className="text-gray-700 font-medium">
                                  {declaration.nom_impot}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  <User size={14} className="inline mr-1" />
                                  {declaration.contribuable} • {declaration.type_contribuable}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-700">
                                {declaration.montant_du.toLocaleString()} $
                              </p>
                              <p className="text-sm text-gray-600">
                                <Calendar size={14} className="inline mr-1" />
                                {new Date(declaration.date_creation).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contenu détaillé */}
                        {expandedDeclarations.includes(declaration.id) && (
                          <div className="p-6 bg-white">
                            {/* Informations financières */}
                            <div className="grid grid-cols-3 gap-6 mb-6">
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-600 font-semibold mb-2">Montant Initial</p>
                                <p className="text-xl font-bold text-blue-700">{declaration.montant_du.toLocaleString()} $</p>
                              </div>
                              <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm text-green-600 font-semibold mb-2">Montant Payé</p>
                                <p className="text-xl font-bold text-green-700">{declaration.montant_paye.toLocaleString()} $</p>
                              </div>
                              <div className="bg-orange-50 rounded-lg p-4">
                                <p className="text-sm text-orange-600 font-semibold mb-2">Solde avec Pénalités</p>
                                <p className="text-xl font-bold text-orange-700">{soldeCalcul.solde.toLocaleString()} $</p>
                                {soldeCalcul.penalites > 0 && (
                                  <p className="text-xs text-orange-500 mt-1">
                                    Dont {soldeCalcul.penalites.toLocaleString()} $ de pénalités
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Informations générales */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                                  <User className="w-4 h-4 mr-2" />
                                  Informations Contribuable
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">NIF:</span>
                                    <span className="font-medium">{declaration.nif_contribuable}</span>
                                  </div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium capitalize">{declaration.type_contribuable}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Période fiscale:</span>
                                    <span className="font-medium">{declaration.periode_fiscale}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Informations Paiement
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Méthode:</span>
                                    <span className="font-medium capitalize">{declaration.methode_paiement}</span>
                                  </div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Lieu:</span>
                                    <span className="font-medium capitalize">{declaration.lieu_paiement}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Statut:</span>
                                    <span className={`font-medium ${
                                      declaration.statut === "payé" ? "text-green-600" :
                                      declaration.statut === "en_attente" ? "text-orange-600" : "text-red-600"
                                    }`}>
                                      {declaration.statut}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bénéficiaires */}
                            {declaration.beneficiaires.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                                  <User className="w-4 h-4 mr-2" />
                                  Répartition des Bénéficiaires
                                </h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="p-3 text-left font-semibold text-gray-700">Bénéficiaire</th>
                                        <th className="p-3 text-left font-semibold text-gray-700">Contact</th>
                                        <th className="p-3 text-center font-semibold text-gray-700">Type Part</th>
                                        <th className="p-3 text-right font-semibold text-gray-700">Montant</th>
                                        <th className="p-3 text-right font-semibold text-gray-700">Pourcentage</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {declaration.beneficiaires.map((beneficiaire, index) => (
                                        <tr key={beneficiaire.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                          <td className="p-3">
                                            <div>
                                              <p className="font-medium text-gray-900">{beneficiaire.nom}</p>
                                              <p className="text-xs text-gray-500">Compte: {beneficiaire.numero_compte}</p>
                                            </div>
                                          </td>
                                          <td className="p-3 text-gray-600">{beneficiaire.telephone}</td>
                                          <td className="p-3 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                              {beneficiaire.type_part}
                                            </span>
                                          </td>
                                          <td className="p-3 text-right font-semibold text-gray-900">
                                            {beneficiaire.montant.toLocaleString()} $
                                          </td>
                                          <td className="p-3 text-right text-gray-600">
                                            {((beneficiaire.montant / declaration.total_beneficiaires) * 100).toFixed(1)}%
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100">
                                      <tr>
                                        <td colSpan={3} className="p-3 text-right font-semibold text-gray-700">
                                          Total:
                                        </td>
                                        <td className="p-3 text-right font-bold text-gray-900">
                                          {declaration.total_beneficiaires.toLocaleString()} $
                                        </td>
                                        <td className="p-3 text-right font-bold text-gray-900">
                                          100%
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Données complémentaires formatées */}
                            {donneesFormatees && donneesFormatees.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Informations Complémentaires
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {donneesFormatees.map((item, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                                      <p className="text-sm font-medium text-gray-600 mb-1">{item.label}</p>
                                      <p className="text-gray-900 font-semibold">{item.value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Version impression/PDF */}
              <div id="rapport-print-content" className="hidden">
                <div className="header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#2c3e50' }}>
                        RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                      </h1>
                      <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 3px 0', color: '#2c3e50' }}>
                        DIRECTION GÉNÉRALE DES IMPÔTS
                      </h2>
                      <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>Service des Déclarations Fiscales</p>
                    </div>
                    <div style={{ textAlign: 'right', border: '2px solid #2c3e50', padding: '10px', borderRadius: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 3px 0' }}>RAPPORT GÉNÉRAL</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>N° {new Date().getTime()}</p>
                    </div>
                  </div>
                </div>

                {/* Résumé */}
                <div className="section">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ border: '1px solid #2c3e50', padding: '12px', borderRadius: '6px', textAlign: 'center', background: '#f8f9fa' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#2c3e50', fontWeight: 'bold' }}>MONTANT TOTAL DÛ</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
                        {rapport.totaux.total_montant_du.toLocaleString()} $
                      </p>
                    </div>
                    <div style={{ border: '1px solid #27ae60', padding: '12px', borderRadius: '6px', textAlign: 'center', background: '#f8f9fa' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#27ae60', fontWeight: 'bold' }}>MONTANT PAYÉ</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#27ae60' }}>
                        {rapport.totaux.total_montant_paye.toLocaleString()} $
                      </p>
                    </div>
                    <div style={{ border: '1px solid #e74c3c', padding: '12px', borderRadius: '6px', textAlign: 'center', background: '#f8f9fa' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#e74c3c', fontWeight: 'bold' }}>SOLDE RESTANT</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#e74c3c' }}>
                        {Math.max(0, rapport.totaux.total_solde).toLocaleString()} $
                      </p>
                    </div>
                    <div style={{ border: '1px solid #8e44ad', padding: '12px', borderRadius: '6px', textAlign: 'center', background: '#f8f9fa' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#8e44ad', fontWeight: 'bold' }}>DÉCLARATIONS</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#8e44ad' }}>
                        {rapport.totaux.total_declarations}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Déclarations détaillées */}
                <div className="section">
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 15px 0', borderBottom: '2px solid #2c3e50', paddingBottom: '5px' }}>
                    DÉCLARATIONS DÉTAILLÉES
                  </h3>
                  
                  {rapport.declarations.map((declaration) => {
                    const soldeCalcul = calculerSoldeAvecPenalites(declaration);
                    const donneesFormatees = formatDonneesJSON(declaration.donnees_json_decoded);

                    return (
                      <div key={declaration.id} className="declaration" style={{ pageBreakInside: 'avoid' }}>
                        <div className="declaration-header">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ 
                                display: 'inline-block', 
                                padding: '4px 12px', 
                                borderRadius: '15px', 
                                fontSize: '10px', 
                                fontWeight: 'bold',
                                backgroundColor: declaration.statut === "payé" ? '#d4edda' : 
                                               declaration.statut === "en_attente" ? '#fff3cd' : '#f8d7da',
                                color: declaration.statut === "payé" ? '#155724' : 
                                      declaration.statut === "en_attente" ? '#856404' : '#721c24',
                                marginRight: '10px',
                                border: '1px solid #ddd'
                              }}>
                                {declaration.statut === "payé" ? "PAYÉ" :
                                 declaration.statut === "en_attente" ? "EN ATTENTE" : "REJETÉ"}
                              </span>
                              <strong style={{ fontSize: '14px' }}>
                                {declaration.reference} - {declaration.nom_impot}
                              </strong>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ fontSize: '16px', color: '#2c3e50' }}>
                                {declaration.montant_du.toLocaleString()} $
                              </strong>
                              <br/>
                              <span style={{ fontSize: '10px', color: '#666' }}>
                                {new Date(declaration.date_creation).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                            {declaration.contribuable} • {declaration.type_contribuable} • NIF: {declaration.nif_contribuable}
                          </div>
                        </div>

                        <div className="declaration-content">
                          {/* Informations financières */}
                          <div className="data-grid">
                            <div className="data-card">
                              <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#2c3e50', fontWeight: 'bold' }}>Montant Initial</p>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{declaration.montant_du.toLocaleString()} $</p>
                            </div>
                            <div className="data-card">
                              <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#27ae60', fontWeight: 'bold' }}>Montant Payé</p>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{declaration.montant_paye.toLocaleString()} $</p>
                            </div>
                            <div className="data-card">
                              <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#e74c3c', fontWeight: 'bold' }}>Solde avec Pénalités</p>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{soldeCalcul.solde.toLocaleString()} $</p>
                              {soldeCalcul.penalites > 0 && (
                                <p style={{ margin: '3px 0 0 0', fontSize: '9px', color: '#e74c3c' }}>
                                  Dont {soldeCalcul.penalites.toLocaleString()} $ de pénalités
                                </p>
                              )}
                            </div>
                            <div className="data-card">
                              <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#8e44ad', fontWeight: 'bold' }}>Méthode Paiement</p>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {declaration.methode_paiement}
                              </p>
                            </div>
                          </div>

                          {/* Bénéficiaires */}
                          {declaration.beneficiaires.length > 0 && (
                            <div className="beneficiary-section">
                              <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#2c3e50' }}>
                                RÉPARTITION DES BÉNÉFICIAIRES
                              </h4>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Bénéficiaire</th>
                                    <th>Contact</th>
                                    <th style={{ textAlign: 'center' }}>Type Part</th>
                                    <th style={{ textAlign: 'right' }}>Montant</th>
                                    <th style={{ textAlign: 'right' }}>Part</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {declaration.beneficiaires.map((beneficiaire) => (
                                    <tr key={beneficiaire.id}>
                                      <td>
                                        <div>
                                          <strong>{beneficiaire.nom}</strong>
                                          <br/>
                                          <span style={{ fontSize: '9px', color: '#666' }}>{beneficiaire.numero_compte}</span>
                                        </div>
                                      </td>
                                      <td>{beneficiaire.telephone}</td>
                                      <td style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                                        {beneficiaire.type_part}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        {beneficiaire.montant.toLocaleString()} $
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                        {((beneficiaire.montant / declaration.total_beneficiaires) * 100).toFixed(1)}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="total-row">
                                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                      {declaration.total_beneficiaires.toLocaleString()} $
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>100%</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}

                          {/* Données complémentaires */}
                          {donneesFormatees && donneesFormatees.length > 0 && (
                            <div>
                              <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: '15px 0 10px 0', color: '#2c3e50' }}>
                                INFORMATIONS COMPLÉMENTAIRES
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {donneesFormatees.map((item, index) => (
                                  <div key={index} style={{ border: '1px solid #e9ecef', padding: '8px', borderRadius: '4px', background: '#f8f9fa' }}>
                                    <p style={{ margin: '0 0 3px 0', fontSize: '9px', color: '#666', fontWeight: 'bold' }}>
                                      {item.label}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold' }}>
                                      {item.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="footer">
                  <p style={{ margin: '0 0 5px 0' }}>Document généré électroniquement - Valable sans signature</p>
                  <p style={{ margin: 0 }}>DIRECTION GÉNÉRALE DES IMPÔTS - RDC • www.dgi.gouv.cd</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '8px' }}>
                    Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}