'use client';
import { useState, useEffect } from 'react';
import { Save, User, Car, Calculator, ArrowRight, ArrowLeft, Printer, CheckCircle, Package, AlertCircle } from 'lucide-react';
import { verifierDelivrance, completerDelivrance, getDonneesImpression, type DelivranceData, type PrintData } from '@/services/delivrance/delivranceService';
import ImmatriculationPrint from './ImmatriculationPrint';

interface Utilisateur {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_nom: string;
  site_code: string;
  formule?: string;
}

interface ClientSimpleFormProps {
  impotId: string;
  utilisateur: Utilisateur | null;
}

type Etape = 'verification' | 'confirmation' | 'recapitulatif';

export default function ClientSimpleForm({ impotId, utilisateur }: ClientSimpleFormProps) {
  const [etapeActuelle, setEtapeActuelle] = useState<Etape>('verification');
  const [reference, setReference] = useState('');
  const [numeroPlaque, setNumeroPlaque] = useState('');
  const [delivranceData, setDelivranceData] = useState<DelivranceData | null>(null);
  const [errors, setErrors] = useState<{reference?: string; numeroPlaque?: string}>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  // Vérification des données
  const handleVerification = async () => {
    if (!reference.trim() || !numeroPlaque.trim()) {
      setErrors({
        reference: !reference.trim() ? 'La référence est obligatoire' : undefined,
        numeroPlaque: !numeroPlaque.trim() ? 'Le numéro de plaque est obligatoire' : undefined
      });
      return;
    }

    setIsVerifying(true);
    setErrors({});
    
    try {
      const result = await verifierDelivrance(reference, numeroPlaque);
      
      if (result.status === 'success' && result.data) {
        setDelivranceData(result.data);
        setShowModal(true);
      } else {
        alert(result.message || 'Erreur lors de la vérification');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      alert('Erreur lors de la vérification des informations.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Compléter la délivrance
  const handleCompleterDelivrance = async () => {
    if (!delivranceData) return;
    
    setIsCompleting(true);
    
    try {
      const result = await completerDelivrance(delivranceData.paiement.id);
      
      if (result.status === 'success') {
        // Mettre à jour les données locales
        setDelivranceData(prev => prev ? {
          ...prev,
          paiement: { ...prev.paiement, etat: 0 }
        } : null);
        
        setEtapeActuelle('recapitulatif');
        setShowModal(false);
      } else {
        alert(result.message || 'Erreur lors de la complétion');
      }
    } catch (error) {
      console.error('Erreur lors de la complétion:', error);
      alert('Erreur lors de la complétion de la délivrance.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Préparer l'impression
  const handlePreparerImpression = async () => {
    if (!delivranceData) return;
    
    try {
      const result = await getDonneesImpression(delivranceData.paiement.id);
      
      if (result.status === 'success' && result.data) {
        setPrintData(result.data);
        setShowPrintModal(true);
      } else {
        alert(result.message || 'Erreur lors de la préparation de l\'impression');
      }
    } catch (error) {
      console.error('Erreur lors de la préparation impression:', error);
      alert('Erreur lors de la préparation de l\'impression.');
    }
  };

  const fermerModal = () => {
    setShowModal(false);
  };

  const passerALaConfirmation = () => {
    setEtapeActuelle('confirmation');
    setShowModal(false);
  };

  const getCouleurEtat = (etat: number) => {
    return etat === 1 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  const getTexteEtat = (etat: number) => {
    return etat === 1 ? 'En attente de délivrance' : 'Délivré';
  };

  // Rendu de l'étape de vérification
  const renderEtapeVerification = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <CheckCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Étape 1: Vérification & Récupération des Données
          </h2>
          <p className="text-gray-600 text-sm">
            Saisissez la référence du paiement et le numéro de plaque pour récupérer automatiquement les informations DGI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {/* RÉFÉRENCE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Référence Paiement <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ex: 12345"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.reference ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.reference && (
            <p className="text-red-600 text-sm mt-1">{errors.reference}</p>
          )}
        </div>

        {/* NUMÉRO PLAQUE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de Plaque <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={numeroPlaque}
            onChange={(e) => setNumeroPlaque(e.target.value)}
            placeholder="Ex: AB-123-CD"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.numeroPlaque ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.numeroPlaque && (
            <p className="text-red-600 text-sm mt-1">{errors.numeroPlaque}</p>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 text-sm">Processus Automatique</h4>
            <p className="text-blue-700 text-sm mt-1">
              Après vérification, le système récupère automatiquement les informations de l'assujetti et du véhicule depuis la base de données DGI.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={handleVerification}
          disabled={isVerifying}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Vérification en cours...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Vérifier et Récupérer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Rendu de l'étape confirmation
  const renderEtapeConfirmation = () => (
    <div className="space-y-8">
      {/* EN-TÊTE AVEC RÉFÉRENCES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Informations Vérifiées & Pré-remplies</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              getCouleurEtat(delivranceData?.paiement.etat || 1)
            }`}>
              {getTexteEtat(delivranceData?.paiement.etat || 1)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Référence:</span>
            <div className="text-gray-700 font-medium">{reference}</div>
          </div>
          <div>
            <span className="text-gray-500">Plaque:</span>
            <div className="text-gray-700 font-medium">{numeroPlaque}</div>
          </div>
          <div>
            <span className="text-gray-500">Montant:</span>
            <div className="text-gray-700 font-medium">{delivranceData?.paiement.montant} $</div>
          </div>
        </div>
      </div>

      {/* SECTION ASSUJETTI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Informations du Propriétaire
              </h2>
              <p className="text-gray-600 text-sm">
                Données récupérées automatiquement depuis la base DGI
              </p>
            </div>
          </div>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            ✓ Pré-remplie
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.particulier.nom}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.particulier.prenom}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.particulier.telephone}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.particulier.email || '-'}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {`${delivranceData?.particulier.rue || ''}, ${delivranceData?.particulier.ville || ''}, ${delivranceData?.particulier.province || ''}`}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NIF</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.particulier.nif}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ID National</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.particulier.id_national || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION ENGIN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Informations du Véhicule
              </h2>
              <p className="text-gray-600 text-sm">
                Caractéristiques techniques récupérées automatiquement
              </p>
            </div>
          </div>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            ✓ Pré-remplie
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plaque</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono">
              {delivranceData?.engin.numero_plaque}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type d'engin</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.engin.type_engin}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.engin.marque}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Énergie</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.engin.energie || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Année fabrication</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.engin.annee_fabrication || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Année circulation</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.engin.annee_circulation || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.engin.couleur || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Puissance fiscale</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.engin.puissance_fiscal || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usage</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              {delivranceData?.engin.usage_engin || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numéro chassis</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono">
              {delivranceData?.engin.numero_chassis || '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numéro moteur</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono">
              {delivranceData?.engin.numero_moteur || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* VALIDATION FINALE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Calculator className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Validation Finale
            </h2>
            <p className="text-gray-600 text-sm">
              Procédez à la délivrance complète plaque + carte
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
          <div>
            <div className="text-sm text-gray-600">Forfait Plaque + Carte</div>
            <div className="text-2xl font-bold text-gray-900">{delivranceData?.paiement.montant} $</div>
            <div className="text-xs text-gray-500 mt-1">
              Paiement déjà effectué - {delivranceData?.paiement.mode_paiement}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Statut délivrance</div>
            <div className={`text-lg font-semibold ${delivranceData?.paiement.etat === 1 ? 'text-red-600' : 'text-green-600'}`}>
              {getTexteEtat(delivranceData?.paiement.etat || 1)}
            </div>
            {utilisateur && (
              <div className="text-xs text-gray-500 mt-1">
                Site: {utilisateur.site_nom}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setEtapeActuelle('verification')}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la vérification</span>
          </button>

          <button
            type="button"
            onClick={handleCompleterDelivrance}
            disabled={isCompleting || delivranceData?.paiement.etat === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isCompleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Traitement en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirmer la Délivrance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Rendu de l'étape récapitulative
  const renderEtapeRecapitulatif = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-green-100 p-2 rounded-lg">
          <Package className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            ✅ Délivrance Complétée
          </h2>
          <p className="text-gray-600 text-sm">
            Les documents Plaque + Carte Rose sont prêts à être imprimés
          </p>
        </div>
      </div>

      {/* RÉCAPITULATIF */}
      <div className="space-y-6 mb-8">
        {/* BANNER SUCCÈS */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Délivrance Confirmée !</h3>
              <p className="text-green-100 mt-1">
                Le processus de délivrance Plaque + Carte a été validé avec succès
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{delivranceData?.paiement.montant} $</div>
              <div className="text-green-200 text-sm">Forfait payé</div>
            </div>
          </div>
        </div>

        {/* INFORMATIONS PAIEMENT */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">Informations Paiement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Référence:</span>
              <div className="font-medium">{reference}</div>
            </div>
            <div>
              <span className="text-blue-600">Plaque:</span>
              <div className="font-medium text-green-600">{numeroPlaque}</div>
            </div>
            <div>
              <span className="text-blue-600">Mode paiement:</span>
              <div className="font-medium">{delivranceData?.paiement.mode_paiement}</div>
            </div>
            <div>
              <span className="text-blue-600">Date paiement:</span>
              <div className="font-medium">{new Date(delivranceData?.paiement.date_paiement || '').toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* DOCUMENTS À IMPRIMER */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h3 className="font-semibold text-orange-800 mb-3">Documents à Imprimer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Plaque d'Immatriculation</div>
                <div className="text-sm text-gray-600">Document officiel métallique</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="bg-green-100 p-2 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Carte Rose</div>
                <div className="text-sm text-gray-600">Certificat d'immatriculation</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOUTONS FINAUX */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setEtapeActuelle('confirmation')}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modifier les informations</span>
        </button>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handlePreparerImpression}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer la Carte Rose</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* MODAL DE CONFIRMATION ÉTAPE 1 */}
      {showModal && delivranceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                {delivranceData.paiement.etat === 1 ? (
                  <AlertCircle className="w-6 h-6 text-yellow-500 mr-2" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                )}
                Données Récupérées avec Succès
              </h3>
              
              <div className="space-y-4 mb-6">
                {/* STATUT DÉLIVRANCE */}
                <div className={`p-4 rounded-lg border ${
                  delivranceData.paiement.etat === 1 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-semibold ${
                        delivranceData.paiement.etat === 1 ? 'text-yellow-800' : 'text-green-800'
                      }`}>
                        Statut de Délivrance
                      </h4>
                      <p className={`text-sm mt-1 ${
                        delivranceData.paiement.etat === 1 ? 'text-yellow-700' : 'text-green-700'
                      }`}>
                        {delivranceData.paiement.etat === 1 
                          ? 'En attente de délivrance - La plaque et la carte peuvent être délivrées'
                          : 'Déjà délivré - Consultation des informations uniquement'
                        }
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getCouleurEtat(delivranceData.paiement.etat)
                    }`}>
                      {getTexteEtat(delivranceData.paiement.etat)}
                    </span>
                  </div>
                </div>

                {/* INFOS PAIEMENT */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Informations Paiement</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Référence:</span>
                      <div className="font-medium">{reference}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Montant:</span>
                      <div className="font-medium">{delivranceData.paiement.montant} $</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Mode paiement:</span>
                      <div className="font-medium">{delivranceData.paiement.mode_paiement}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Date:</span>
                      <div className="font-medium">
                        {new Date(delivranceData.paiement.date_paiement).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PLAQUE ASSIGNÉE */}
                <div className="bg-green-100 p-6 rounded-lg border-2 border-green-400 text-center">
                  <div className="text-green-800 text-sm mb-2">Plaque assignée et validée</div>
                  <div className="text-3xl font-bold text-green-700 bg-white py-3 px-6 rounded-lg border-2 border-green-500 font-mono">
                    {delivranceData.engin.numero_plaque}
                  </div>
                </div>

                {/* RÉSUMÉ PROPRIÉTAIRE */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Propriétaire du Véhicule</h4>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nom complet:</span>
                      <span className="font-medium">
                        {delivranceData.particulier.nom} {delivranceData.particulier.prenom}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Téléphone:</span>
                      <span className="font-medium">{delivranceData.particulier.telephone}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">NIF:</span>
                      <span className="font-medium">{delivranceData.particulier.nif}</span>
                    </div>
                  </div>
                </div>

                {/* RÉSUMÉ VÉHICULE */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Caractéristiques du Véhicule</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium ml-2">{delivranceData.engin.type_engin}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Marque:</span>
                      <span className="font-medium ml-2">{delivranceData.engin.marque}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Énergie:</span>
                      <span className="font-medium ml-2">{delivranceData.engin.energie || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Année:</span>
                      <span className="font-medium ml-2">{delivranceData.engin.annee_fabrication || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={fermerModal}
                  className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={passerALaConfirmation}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Vérifier les Données</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL D'IMPRESSION */}
      {showPrintModal && printData && (
        <ImmatriculationPrint
          data={printData}
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* RENDU PRINCIPAL SELON L'ÉTAPE */}
      {etapeActuelle === 'verification' && renderEtapeVerification()}
      {etapeActuelle === 'confirmation' && delivranceData && renderEtapeConfirmation()}
      {etapeActuelle === 'recapitulatif' && delivranceData && renderEtapeRecapitulatif()}
    </>
  );
}