'use client';
import React, { useState, useEffect } from 'react';
import { Home, ArrowRight, ArrowLeft, CreditCard, Smartphone, DollarSign, Building, FileCheck, LucideIcon, Printer, Trash2, Download } from 'lucide-react';
import Portal from '../components/Portal';
import { verifierNif, getImpots, enregistrerDeclaration, traiterPaiement, supprimerDeclaration, Contribuable, Impot, FormulaireData } from '../../../services/paiement/paiementService';

// Types TypeScript
type FieldType = "texte" | "nombre" | "liste" | "fichier";

interface FormField {
  type: FieldType;
  champ: string;
  options?: string[] | { valeur: string, sousRubriques?: FormField[] }[];
  sousRubriques?: FormField[];
}

interface TaxOption {
  id: number;
  name: string;
  formula: FormField[];
}

interface PaymentMethod {
  id: number;
  name: string;
  icon: LucideIcon;
}

interface FormData {
  [key: string]: string | number;
}

// Options de paiement
const paymentMethods: PaymentMethod[] = [
  { id: 1, name: "Cash", icon: DollarSign },
  { id: 2, name: "Mobile Money", icon: Smartphone },
  { id: 3, name: "Dépôt bancaire", icon: Building },
  { id: 4, name: "Chèque", icon: FileCheck },
  { id: 5, name: "Carte bancaire", icon: CreditCard }
];

const PaiementPage: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [nif, setNif] = useState<string>('');
  const [selectedTax, setSelectedTax] = useState<Impot | null>(null);
  const [declarationCount, setDeclarationCount] = useState<number>(1);
  const [formsData, setFormsData] = useState<FormData[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [taxOptions, setTaxOptions] = useState<Impot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [contribuable, setContribuable] = useState<Contribuable | null>(null);
  const [declarationReference, setDeclarationReference] = useState<string>('');
  const [idDeclaration, setIdDeclaration] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Charger les impôts au montage du composant
  useEffect(() => {
    const loadImpots = async () => {
      setLoading(true);
      const result = await getImpots();
      if (result.status === 'success') {
        setTaxOptions(result.data);
      } else {
        setError(result.message || 'Erreur lors du chargement des impôts');
      }
      setLoading(false);
    };

    loadImpots();
  }, []);

  // Calculer le montant (simulation)
  const calculateAmount = (): number => {
    return declarationCount * 15000; // Montant fictif
  };

  // Passer à l'étape suivante
  const nextStep = (): void => {
    if (step < 4) setStep(step + 1);
  };

  // Revenir à l'étape précédente
  const prevStep = (): void => {
    if (step > 1) setStep(step - 1);
  };

  // Vérifier le NIF
  const handleNifVerification = async (): Promise<void> => {
    if (!nif.trim()) {
      setError('Veuillez saisir un NIF');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await verifierNif(nif);
    
    if (result.status === 'success') {
      setContribuable(result.data);
      nextStep();
    } else {
      setError(result.message || 'Erreur lors de la vérification du NIF');
    }
    
    setLoading(false);
  };

  // Gérer la soumission du formulaire
  const handleFormSubmit = (formIndex: number, field: string, value: string): void => {
    const newFormsData = [...formsData];
    if (!newFormsData[formIndex]) newFormsData[formIndex] = {};
    newFormsData[formIndex][field] = value;
    setFormsData(newFormsData);
  };

  // Enregistrer la déclaration
  const handleDeclarationSubmit = async (): Promise<void> => {
    if (!selectedTax) {
      setError('Veuillez sélectionner un impôt');
      return;
    }

    setLoading(true);
    setError('');

    const result = await enregistrerDeclaration(
      selectedTax.id,
      calculateAmount(),
      formsData
    );

    if (result.status === 'success') {
      setDeclarationReference(result.data.reference);
      setIdDeclaration(result.data.id_declaration);
      nextStep();
    } else {
      setError(result.message || 'Erreur lors de l\'enregistrement de la déclaration');
    }

    setLoading(false);
  };

  // Supprimer la déclaration
  const handleDeleteDeclaration = async (): Promise<void> => {
    if (!idDeclaration) {
      setError('Aucune déclaration à supprimer');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette déclaration ?')) {
      return;
    }

    setLoading(true);
    setError('');

    const result = await supprimerDeclaration(idDeclaration);

    if (result.status === 'success') {
      setSuccess('Déclaration supprimée avec succès');
      // Réinitialiser le processus
      setStep(1);
      setIdDeclaration(null);
      setDeclarationReference('');
      setFormsData([]);
    } else {
      setError(result.message || 'Erreur lors de la suppression de la déclaration');
    }

    setLoading(false);
  };

  // Traiter le paiement
  const handlePayment = async (): Promise<void> => {
    if (!idDeclaration || !selectedPaymentMethod) {
      setError('Veuillez sélectionner un mode de paiement');
      return;
    }

    setLoading(true);
    setError('');

    const result = await traiterPaiement(idDeclaration, selectedPaymentMethod);

    if (result.status === 'success') {
      setPaymentReference(result.data.reference_paiement);
      setSuccess('Paiement effectué avec succès');
      setShowPaymentModal(false);
      setShowReceiptModal(true);
    } else {
      setError(result.message || 'Erreur lors du traitement du paiement');
    }

    setLoading(false);
  };

  // Imprimer le reçu
  const handlePrintReceipt = (): void => {
    window.print();
  };

  // Rendu dynamique des champs de formulaire
  const renderFormFields = (fields: FormField[], formIndex: number, parentField = '') => {
    return fields.map((field, fieldIndex) => {
      const fieldKey = parentField ? `${parentField}_${field.champ}` : field.champ;
      const fieldId = `form-${formIndex}-${fieldKey}`;
      
      return (
        <div key={fieldIndex} className="mb-4">
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
            {field.champ}
          </label>
          
          {field.type === 'texte' && (
            <input
              type="text"
              id={fieldId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleFormSubmit(formIndex, fieldKey, e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153258] focus:border-transparent"
            />
          )}
          
          {field.type === 'nombre' && (
            <input
              type="number"
              id={fieldId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleFormSubmit(formIndex, fieldKey, e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153258] focus:border-transparent"
            />
          )}
          
          {field.type === 'liste' && field.options && (
            <select
              id={fieldId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                handleFormSubmit(formIndex, fieldKey, e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153258] focus:border-transparent"
            >
              <option value="">Sélectionnez une option</option>
              {field.options.map((option, optIndex) => (
                <option key={optIndex} value={typeof option === 'string' ? option : option.valeur}>
                  {typeof option === 'string' ? option : option.valeur}
                </option>
              ))}
            </select>
          )}
          
          {field.type === 'fichier' && (
            <input
              type="file"
              id={fieldId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) {
                  handleFormSubmit(formIndex, fieldKey, e.target.files[0].name);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153258] focus:border-transparent"
            />
          )}
          
          {/* Sous-rubriques */}
          {field.sousRubriques && field.sousRubriques.length > 0 && (
            <div className="ml-6 mt-2 pl-4 border-l-2 border-gray-200">
              {renderFormFields(field.sousRubriques, formIndex, fieldKey)}
            </div>
          )}
        </div>
      );
    });
  };

  // Étape 1: Saisie du NIF
  const renderStep1 = (): React.ReactElement => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        Saisie du numéro NIF
      </h2>
      <p className="text-gray-600 mb-6">
        Veuillez entrer le numéro d'identification fiscale (NIF) du contribuable.
      </p>
      
      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={nif}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNif(e.target.value)}
          placeholder="Ex: 1234567890"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153258] focus:border-transparent"
        />
        
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {success && <div className="text-green-500 mt-2">{success}</div>}
        
        <button
          onClick={handleNifVerification}
          disabled={!nif.trim() || loading}
          className="mt-6 w-full bg-gradient-to-r from-[#153258] to-[#23A974] text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Vérification...' : 'Continuer'} <ArrowRight className="inline ml-2" size={18} />
        </button>
      </div>
    </div>
  );

  // Étape 2: Choix de l'impôt et nombre de déclarations
  const renderStep2 = (): React.ReactElement => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Choix de l'impôt à payer
      </h2>
      <p className="text-gray-600 mb-6">
        Sélectionnez le type d'impôt et indiquez le nombre de déclarations à effectuer.
      </p>
      
      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type d'impôt</label>
          <select
            value={selectedTax?.id || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
              setSelectedTax(taxOptions.find(tax => tax.id === parseInt(e.target.value)) || null)
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153258] focus:border-transparent"
          >
            <option value="">Sélectionnez un impôt</option>
            {taxOptions.map(tax => (
              <option key={tax.id} value={tax.id}>{tax.nom}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de déclarations</label>
          <input
            type="number"
            min="1"
            value={declarationCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeclarationCount(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153258] focus:border-transparent"
          />
        </div>
        
        <div className="flex justify-between pt-4">
          <button
            onClick={prevStep}
            className="flex items-center text-[#153258] font-medium hover:underline"
          >
            <ArrowLeft className="mr-2" size={18} /> Retour
          </button>
          
          <button
            onClick={nextStep}
            disabled={!selectedTax}
            className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white py-2 px-6 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer <ArrowRight className="inline ml-2" size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Étape 3: Formulaire de déclaration
  const renderStep3 = (): React.ReactElement => {
    if (!selectedTax || !selectedTax.formulaire_json || !selectedTax.formulaire_json.formulaire) {
      return (
        <div className="text-center py-10">
          <div className="text-red-500">Erreur: Structure de formulaire invalide</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {selectedTax.nom} - Déclaration(s)
        </h2>
        <p className="text-gray-600 mb-6">
          Veuillez remplir les informations requises pour chaque déclaration.
        </p>
        
        <div className="max-w-2xl mx-auto">
          {Array.from({ length: declarationCount }).map((_, formIndex) => (
            <div key={formIndex} className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Déclaration #{formIndex + 1}
              </h3>
              
              <div className="space-y-4">
                {renderFormFields(selectedTax.formulaire_json.formulaire, formIndex)}
              </div>
            </div>
          ))}
          
          <div className="flex justify-between pt-4">
            <button
              onClick={prevStep}
              className="flex items-center text-[#153258] font-medium hover:underline"
            >
              <ArrowLeft className="mr-2" size={18} /> Retour
            </button>
            
            <button
              onClick={handleDeclarationSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white py-2 px-6 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Calculer et continuer'} <ArrowRight className="inline ml-2" size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Étape 4: Récapitulatif
  const renderStep4 = (): React.ReactElement => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Récapitulatif de la transaction
      </h2>
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">NIF</p>
            <p className="font-medium">{nif}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contribuable</p>
            <p className="font-medium">
              {contribuable?.prenom ? `${contribuable.prenom} ${contribuable.nom}` : contribuable?.nom}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type d'impôt</p>
            <p className="font-medium">{selectedTax?.nom}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nombre de déclarations</p>
            <p className="font-medium">{declarationCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Référence</p>
            <p className="font-medium">{declarationReference}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Montant total</p>
            <p className="font-medium text-[#23A974]">{calculateAmount().toLocaleString()} FCFA</p>
          </div>
        </div>
        
        {/* Aperçu des données du formulaire */}
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Aperçu des données</h3>
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
            <pre className="text-sm">
              {JSON.stringify(formsData, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="flex justify-between pt-6">
          <button
            onClick={prevStep}
            className="flex items-center text-[#153258] font-medium hover:underline"
          >
            <ArrowLeft className="mr-2" size={18} /> Retour
          </button>
          
          <div className="space-x-4">
            <button
              onClick={handleDeleteDeclaration}
              disabled={loading}
              className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="inline mr-2" size={18} /> Supprimer
            </button>
            
            <button
              onClick={() => setShowReceiptModal(true)}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <Download className="inline mr-2" size={18} /> Reçu
            </button>
            
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white py-2 px-6 rounded-lg font-medium hover:opacity-90 transition"
            >
              Payer maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal de paiement
  const renderPaymentModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    
    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Choisissez votre mode de paiement</h3>
            
            <div className="space-y-3 mb-6">
              {paymentMethods.map(method => {
                const Icon = method.icon;
                return (
                  <div 
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                      selectedPaymentMethod === method.id 
                        ? 'border-[#23A974] bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="text-gray-600 mr-3" size={20} />
                    <span className="font-medium">{method.name}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:underline"
              >
                Annuler
              </button>
              
              <button
                onClick={handlePayment}
                disabled={!selectedPaymentMethod || loading}
                className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white py-2 px-6 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Traitement...' : 'Confirmer le paiement'}
              </button>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  // Modal de reçu
  const renderReceiptModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    
    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Reçu de Paiement</h2>
              <p className="text-gray-600">Référence: {paymentReference}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Informations du Contribuable</h3>
                <p><span className="font-medium">NIF:</span> {nif}</p>
                <p><span className="font-medium">Nom:</span> {contribuable?.prenom ? `${contribuable.prenom} ${contribuable.nom}` : contribuable?.nom}</p>
                <p><span className="font-medium">Type:</span> {contribuable?.type}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Détails du Paiement</h3>
                <p><span className="font-medium">Référence Déclaration:</span> {declarationReference}</p>
                <p><span className="font-medium">Type d'impôt:</span> {selectedTax?.nom}</p>
                <p><span className="font-medium">Mode de paiement:</span> {selectedMethod?.name}</p>
                <p><span className="font-medium">Montant:</span> {calculateAmount().toLocaleString()} FCFA</p>
                <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Détails de la Déclaration</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm">
                  {JSON.stringify(formsData, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 mb-6">
              <p>Ce reçu est une preuve de votre déclaration et paiement.</p>
              <p>Conservez-le pour vos archives.</p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center bg-[#153258] text-white py-2 px-6 rounded-lg font-medium hover:opacity-90 transition"
              >
                <Printer className="mr-2" size={18} /> Imprimer
              </button>
              
              <button
                onClick={() => setShowReceiptModal(false)}
                className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-400 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Indicateur de progression */}
      <div className="flex justify-center mb-10">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              i === step 
                ? 'bg-[#153258] text-white' 
                : i < step 
                  ? 'bg-[#23A974] text-white' 
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {i}
            </div>
            {i < 4 && (
              <div className={`w-16 h-1 ${i < step ? 'bg-[#23A974]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Messages d'alerte */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}
      
      {/* Contenu de l'étape actuelle */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      
      {/* Modal de paiement */}
      {showPaymentModal && renderPaymentModal()}
      
      {/* Modal de reçu */}
      {showReceiptModal && renderReceiptModal()}
    </div>
  );
};

export default PaiementPage;